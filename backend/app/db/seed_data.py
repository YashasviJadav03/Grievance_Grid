from sqlalchemy.orm import Session
from app.models.department import Department
from app.models.category import Category
from app.models.sla_rule import SLARule
from app.models.user import User


DEPARTMENTS_DATA = [
    {
        "code": "WATER",
        "name": "Water Supply & Sewerage Board",
        "description": "Handles civic drinking water supply, pipeline maintenance, leaks, and drainage systems.",
        "contact_email": "water.support@grievance.gov.in",
        "supervisor_email": "water.supervisor@grievance.gov.in",
        "categories": [
            {
                "name": "Contaminated / No Water Supply",
                "sla_hours": 12,
                "priority": "CRITICAL",
                "keywords": "no water, drinking water, muddy, contaminated, tanker, stopped supply"
            },
            {
                "name": "Pipe Burst / Water Leakage",
                "sla_hours": 24,
                "priority": "HIGH",
                "keywords": "burst, pipe, leak, leakage, gushing, flooded"
            },
            {
                "name": "Low Water Pressure",
                "sla_hours": 48,
                "priority": "MEDIUM",
                "keywords": "pressure, low pressure, trickle, overhead tank"
            },
        ]
    },
    {
        "code": "ROADS",
        "name": "Roads & Public Infrastructure",
        "description": "Responsible for public road quality, potholes, pedestrian walkways, street lighting, and signals.",
        "contact_email": "roads.support@grievance.gov.in",
        "supervisor_email": "roads.supervisor@grievance.gov.in",
        "categories": [
            {
                "name": "Pothole / Road Damage",
                "sla_hours": 48,
                "priority": "MEDIUM",
                "keywords": "pothole, crater, broken road, asphalt, tar, pavement"
            },
            {
                "name": "Broken Streetlight / Dark Spot",
                "sla_hours": 24,
                "priority": "HIGH",
                "keywords": "street light, streetlight, lamp, dark spot, unsafe, blinking"
            },
            {
                "name": "Traffic Signal Malfunction",
                "sla_hours": 6,
                "priority": "CRITICAL",
                "keywords": "traffic signal, traffic light, signal, red light stuck, junction jam"
            },
        ]
    },
    {
        "code": "ELECTRICITY",
        "name": "Electricity & Power Distribution",
        "description": "Manages power grid reliability, transformer health, electrical hazards, and metering.",
        "contact_email": "power.support@grievance.gov.in",
        "supervisor_email": "power.supervisor@grievance.gov.in",
        "categories": [
            {
                "name": "Fallen Power Line / Wire Hazard",
                "sla_hours": 4,
                "priority": "CRITICAL",
                "keywords": "hanging wire, live wire, snapped cable, sparking, transformer explosion"
            },
            {
                "name": "Frequent Power Cuts / Blackout",
                "sla_hours": 12,
                "priority": "HIGH",
                "keywords": "power cut, blackout, load shedding, outage, no power"
            },
            {
                "name": "Faulty / Burnt Electricity Meter",
                "sla_hours": 72,
                "priority": "LOW",
                "keywords": "meter, burnt meter, digital meter, meter reading, voltage surge"
            },
        ]
    },
    {
        "code": "SANITATION",
        "name": "Sanitation & Solid Waste Management",
        "description": "Oversees municipal garbage collection, waste segregation, drain clearing, and public hygiene.",
        "contact_email": "sanitation.support@grievance.gov.in",
        "supervisor_email": "sanitation.supervisor@grievance.gov.in",
        "categories": [
            {
                "name": "Clogged Drain / Sewer Overflow",
                "sla_hours": 12,
                "priority": "CRITICAL",
                "keywords": "clogged drain, sewer overflow, gutter, manhole, dirty water"
            },
            {
                "name": "Uncollected Garbage / Overflowing Dumpster",
                "sla_hours": 24,
                "priority": "HIGH",
                "keywords": "garbage, trash, waste, dumpster, dump, stench, uncollected"
            },
            {
                "name": "Dead Animal Disposal",
                "sla_hours": 8,
                "priority": "HIGH",
                "keywords": "dead animal, carcass, decaying, dead dog"
            },
        ]
    }
]


def seed_database(db: Session):
    # Check if departments already exist
    existing_depts = db.query(Department).count()
    if existing_depts > 0:
        return

    print("Seeding core civic departments, categories, and SLA rules...")
    for d_data in DEPARTMENTS_DATA:
        dept = Department(
            code=d_data["code"],
            name=d_data["name"],
            description=d_data["description"],
            contact_email=d_data["contact_email"],
            supervisor_email=d_data["supervisor_email"]
        )
        db.add(dept)
        db.flush()

        # Add an officer user for this department
        officer = User(
            name=f"{d_data['code']} Lead Officer",
            email=f"officer.{d_data['code'].lower()}@grievance.gov.in",
            role="OFFICER",
            department_id=dept.id
        )
        db.add(officer)

        # Add categories and SLA rules
        for c_data in d_data["categories"]:
            cat = Category(
                name=c_data["name"],
                department_id=dept.id,
                default_sla_hours=c_data["sla_hours"],
                priority=c_data["priority"],
                keywords=c_data["keywords"]
            )
            db.add(cat)
            db.flush()

            sla_rule = SLARule(
                category_id=cat.id,
                warning_threshold_pct=0.75,
                breach_hours=c_data["sla_hours"],
                escalate_to_role="SUPERVISOR"
            )
            db.add(sla_rule)

    # Add Admin user
    admin_user = User(
        name="Chief Grievance Administrator",
        email="admin@grievance.gov.in",
        role="ADMIN"
    )
    db.add(admin_user)

    db.commit()
    print("Database seeded successfully with 4 departments, 12 categories, and SLA policies!")
