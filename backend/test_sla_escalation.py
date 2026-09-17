import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app


def test_sla_escalation_flow():
    print("\n--- PHASE 3 MILESTONE TEST: SLA Backdating & Auto-Escalation ---")
    with TestClient(app) as client:
        # Step 1: Submit a complaint
        payload = {
            "citizen_name": "Aarav Gupta",
            "citizen_contact": "+91-9988776655",
            "title": "Severe sewage drain backup in apartment parking",
            "description": "Black smelly water is overflowing and flooding the parking lot."
        }
        res = client.post("/api/v1/complaints/", json=payload)
        assert res.status_code == 201, f"Failed to submit: {res.text}"
        ticket = res.json()
        tracking_id = ticket["tracking_id"]
        initial_status = ticket["status"]
        print(f"1. Submitted Complaint: {tracking_id} | Initial Status: {initial_status} | SLA Deadline: {ticket['sla_deadline']}")
        assert initial_status == "ROUTED"
        assert ticket["is_breached"] is False

        # Step 2: Manually backdate the complaint by 24 hours (breaching the 12h SLA)
        backdate_res = client.post(
            "/api/v1/sla/simulate-backdate",
            json={"tracking_id": tracking_id, "hours_back": 24}
        )
        assert backdate_res.status_code == 200, f"Backdating failed: {backdate_res.text}"
        print(f"2. Backdated timestamps by 24 hours: New Deadline = {backdate_res.json()['new_sla_deadline']}")

        # Step 3: Run the SLA scanner job
        scan_res = client.post("/api/v1/sla/scan")
        assert scan_res.status_code == 200
        scan_data = scan_res.json()["result"]
        print(f"3. SLA scan output: Scanned = {scan_data['scanned_count']}, Newly Escalated = {scan_data['escalated_count']}")
        assert tracking_id in scan_data["escalated_tracking_ids"], f"{tracking_id} was not in escalated list!"

        # Step 4: Fetch complaint and assert status flipped to ESCALATED
        get_res = client.get(f"/api/v1/complaints/{tracking_id}")
        assert get_res.status_code == 200
        escalated_ticket = get_res.json()
        print(f"4. Complaint Status after SLA Sweep: {escalated_ticket['status']}")
        print(f"   Priority: {escalated_ticket['priority']}")
        print(f"   Assigned To: {escalated_ticket['assigned_to']}")
        print(f"   Breached: {escalated_ticket['is_breached']}")
        print(f"   SLA Status Indicator: {escalated_ticket['sla_status']}")

        assert escalated_ticket["status"] == "ESCALATED", f"Expected ESCALATED, got {escalated_ticket['status']}"
        assert escalated_ticket["is_breached"] is True
        assert escalated_ticket["priority"] == "CRITICAL"
        assert escalated_ticket["sla_status"] == "RED"
        assert "SUPERVISOR_QUEUE_" in escalated_ticket["assigned_to"]

        # Step 5: Check audit trail has the SYSTEM_SLA_ENGINE escalation log
        latest_log = escalated_ticket["status_logs"][0]
        print(f"5. Latest Audit Log: [{latest_log['changed_by']}] {latest_log['from_status']} -> {latest_log['to_status']}: '{latest_log['reason']}'")
        assert latest_log["to_status"] == "ESCALATED"
        assert latest_log["changed_by"] == "SYSTEM_SLA_ENGINE"

        print("\n=======================================================")
        print("SUCCESS: PHASE 3 SLA ESCALATION MILESTONE VERIFIED 100%!")
        print("=======================================================")


if __name__ == "__main__":
    test_sla_escalation_flow()
