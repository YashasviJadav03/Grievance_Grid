import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.classifier.engine import classifier_engine

def run_all_tests():
    with TestClient(app) as client:
        test_seed_and_departments(client)
        test_classifier_milestone()
        test_complaint_intake_and_retrieval(client)
        test_state_machine_transition(client)
        print("\n==============================================")
        print("ALL PHASE 0, 1 & 2 MILESTONE CHECKS COMPLETED!")
        print("==============================================")


def test_seed_and_departments(client):
    print("\n--- TEST 1: Verifying Seed Data & Departments ---")
    response = client.get("/api/v1/departments/")
    assert response.status_code == 200, f"Failed: {response.text}"
    departments = response.json()
    assert len(departments) == 4, f"Expected 4 departments, got {len(departments)}"
    dept_codes = {d["code"] for d in departments}
    assert dept_codes == {"WATER", "ROADS", "ELECTRICITY", "SANITATION"}
    print(f"PASS: 4 civic departments loaded: {list(dept_codes)}")
    
    total_categories = sum(len(d["categories"]) for d in departments)
    assert total_categories == 12, f"Expected 12 categories, got {total_categories}"
    print(f"PASS: 12 categories and SLA rules verified.")


def test_classifier_milestone():
    print("\n--- TEST 2: Milestone Check (Phase 2 Auto-Classification) ---")
    test_cases = [
        ("No water supply in my area for 3 days", "Water supply has been completely halted in sector 4", "WATER"),
        ("Dangerous pothole near the flyover", "Huge crater on asphalt road causing scooter accidents", "ROADS"),
        ("Live wire snapped and hanging from pole", "High tension electrical cable sparking on street", "ELECTRICITY"),
        ("Garbage dump overflowing outside apartment", "Municipal truck has not collected trash for a week", "SANITATION"),
    ]

    for title, desc, expected_dept in test_cases:
        res = classifier_engine.classify(title, desc)
        print(f"Input: '{title}' -> Predicted: {res['department_code']} (Category: '{res['category_name']}', Confidence: {res['confidence']}, Method: {res['method']})")
        assert res["department_code"] == expected_dept, f"Expected {expected_dept}, got {res['department_code']}"
    print("PASS: Auto-classification correctly routes civic grievances!")


def test_complaint_intake_and_retrieval(client):
    print("\n--- TEST 3: Milestone Check (Phase 1 POST & GET from DB) ---")
    payload = {
        "citizen_name": "Rohan Sharma",
        "citizen_contact": "+91-9876543210",
        "citizen_email": "rohan.sharma@example.com",
        "title": "No water supply in my area for 3 days",
        "description": "Drinking water has completely stopped in Block B for the past 72 hours. Please restore immediately."
    }

    # POST complaint
    post_res = client.post("/api/v1/complaints/", json=payload)
    assert post_res.status_code == 201, f"POST failed: {post_res.text}"
    created = post_res.json()
    
    tracking_id = created["tracking_id"]
    assert tracking_id.startswith("GG-"), f"Invalid tracking ID: {tracking_id}"
    assert created["department"]["code"] == "WATER", f"Expected WATER dept, got {created['department']['code']}"
    assert created["status"] == "ROUTED"
    assert created["sla_deadline"] is not None
    assert created["sla_status"] == "GREEN"
    assert len(created["status_logs"]) == 2  # SUBMITTED + ROUTED logs
    print(f"PASS: Complaint successfully created with tracking ID: {tracking_id}")
    print(f"      Routed to: {created['department']['name']} | Category: {created['category']['name']}")
    print(f"      SLA Deadline: {created['sla_deadline']} | SLA Status: {created['sla_status']}")
    print(f"      Audit Trail Count: {len(created['status_logs'])} entries")

    # GET complaint by tracking ID
    get_res = client.get(f"/api/v1/complaints/{tracking_id}")
    assert get_res.status_code == 200, f"GET failed: {get_res.text}"
    fetched = get_res.json()
    assert fetched["tracking_id"] == tracking_id
    assert fetched["citizen_name"] == "Rohan Sharma"
    print("PASS: Complaint successfully retrieved by tracking ID from database.")

    # LIST complaints with department filter
    list_res = client.get(f"/api/v1/complaints/?department_id={created['department_id']}")
    assert list_res.status_code == 200
    complaints_list = list_res.json()
    assert len(complaints_list) >= 1
    print(f"PASS: Filtered complaints list returned {len(complaints_list)} ticket(s).")


def test_state_machine_transition(client):
    print("\n--- TEST 4: State Machine Transitions & Audit Trail ---")
    # Submit complaint
    payload = {
        "citizen_name": "Priya Patel",
        "citizen_contact": "+91-9123456789",
        "title": "Broken streetlight making junction dark",
        "description": "Streetlight pole #42 is dead and creates an unsafe blind spot."
    }
    create_res = client.post("/api/v1/complaints/", json=payload)
    complaint_id = create_res.json()["id"]

    # Transition ROUTED -> IN_PROGRESS
    step1_res = client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"target_status": "IN_PROGRESS", "actor": "OFFICER_PATEL", "reason": "Dispatched maintenance crew to site."}
    )
    assert step1_res.status_code == 200
    assert step1_res.json()["status"] == "IN_PROGRESS"

    # Transition IN_PROGRESS -> RESOLVED
    step2_res = client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"target_status": "RESOLVED", "actor": "OFFICER_PATEL", "resolution_notes": "LED bulb and fuse replaced. Lamp fully functional."}
    )
    assert step2_res.status_code == 200
    updated = step2_res.json()
    assert updated["status"] == "RESOLVED"
    assert updated["resolution_notes"] is not None
    assert len(updated["status_logs"]) == 4  # SUBMITTED -> ROUTED -> IN_PROGRESS -> RESOLVED
    print(f"PASS: State machine transitioned ROUTED -> IN_PROGRESS -> RESOLVED with full audit trail ({len(updated['status_logs'])} log entries).")


if __name__ == "__main__":
    run_all_tests()
