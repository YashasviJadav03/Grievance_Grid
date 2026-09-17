import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.classifier.engine import classifier_engine

def test_loopholes_suite():
    print("\n--- RUNNING LOOPHOLE & EDGE-CASE VALIDATION SUITE ---")
    with TestClient(app) as client:
        # 1. Test Case-insensitive & whitespace-trimmed tracking ID lookup
        payload = {
            "citizen_name": "Kavita Rao",
            "citizen_contact": "+91-9876501234",
            "title": "Low water pressure in municipal pipeline",
            "description": "Pressure is insufficient to reach the overhead tank in block D."
        }
        res = client.post("/api/v1/complaints/", json=payload)
        assert res.status_code == 201
        tracking_id = res.json()["tracking_id"]
        
        # Test lowercase
        get_lower = client.get(f"/api/v1/complaints/{tracking_id.lower()}")
        assert get_lower.status_code == 200, f"Failed lowercase lookup: {get_lower.text}"
        assert get_lower.json()["tracking_id"] == tracking_id
        
        # Test with spaces
        get_spaced = client.get(f"/api/v1/complaints/%20%20{tracking_id}%20%20")
        assert get_spaced.status_code == 200, f"Failed spaced lookup: {get_spaced.text}"
        print("PASS Loophole 1: Tracking ID lookup is case-insensitive and whitespace tolerant.")

        # 2. Test SLA countdown freezes on RESOLVED
        cid = res.json()["id"]
        # ROUTED -> IN_PROGRESS
        client.patch(f"/api/v1/complaints/{cid}/status", json={"target_status": "IN_PROGRESS", "actor": "OFFICER"})
        # IN_PROGRESS -> RESOLVED
        res_resolved = client.patch(f"/api/v1/complaints/{cid}/status", json={"target_status": "RESOLVED", "actor": "OFFICER", "resolution_notes": "Pipeline valve cleared."})
        assert res_resolved.status_code == 200
        resolved_data = res_resolved.json()
        assert resolved_data["sla_status"] == "RESOLVED"
        assert resolved_data["sla_hours_remaining"] is not None
        assert resolved_data["sla_hours_remaining"] > 0
        print(f"PASS Loophole 2: Resolved ticket SLA is frozen (remaining: {resolved_data['sla_hours_remaining']}h, status: RESOLVED).")

        # 3. Test Re-opening ticket clears resolved_at
        res_reopened = client.patch(f"/api/v1/complaints/{cid}/status", json={"target_status": "IN_PROGRESS", "actor": "OFFICER", "reason": "Citizen reported issue persists."})
        assert res_reopened.status_code == 200
        assert res_reopened.json()["status"] == "IN_PROGRESS"
        assert res_reopened.json()["resolved_at"] is None
        print("PASS Loophole 3: Reopened grievance clears resolved_at timestamp.")

        # 4. Test Stop-word-only classifier input safety
        stop_words_only = "the and or of in on at by for with"
        clf_res = classifier_engine.classify(stop_words_only, stop_words_only)
        assert clf_res is not None
        assert "department_code" in clf_res
        print("PASS Loophole 4: Stop-word-only input does not crash classifier.")

        print("\n=======================================================")
        print("ALL LOOPHOLE & EDGE-CASE VALIDATION CHECKS PASSED 100%!")
        print("=======================================================")

if __name__ == "__main__":
    test_loopholes_suite()
