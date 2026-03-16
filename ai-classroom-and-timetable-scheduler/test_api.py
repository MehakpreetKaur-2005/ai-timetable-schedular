"""
Complete Test Script for AI Timetable Scheduling System
Run this after starting the server with: uvicorn main:app --reload
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health():
    print_section("1. HEALTH CHECK")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def add_courses():
    print_section("2. ADDING COURSES")
    courses = [
        {
            "id": "CS101",
            "name": "Data Structures",
            "duration": 1,
            "student_strength": 60,
            "requires_lab": False
        },
        {
            "id": "CS102",
            "name": "Algorithms",
            "duration": 1,
            "student_strength": 55,
            "requires_lab": False
        },
        {
            "id": "CS103",
            "name": "Database Systems",
            "duration": 1,
            "student_strength": 50,
            "requires_lab": True
        },
        {
            "id": "CS104",
            "name": "Operating Systems",
            "duration": 1,
            "student_strength": 58,
            "requires_lab": False
        },
        {
            "id": "CS105",
            "name": "Computer Networks",
            "duration": 1,
            "student_strength": 52,
            "requires_lab": False
        }
    ]
    
    response = requests.post(f"{BASE_URL}/api/courses/bulk", json=courses)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def add_faculty():
    print_section("3. ADDING FACULTY")
    faculty = [
        {
            "id": "F001",
            "name": "Dr. John Smith",
            "department": "Computer Science",
            "max_hours_per_week": 18,
            "specializations": ["Data Structures", "Algorithms"]
        },
        {
            "id": "F002",
            "name": "Dr. Jane Doe",
            "department": "Computer Science",
            "max_hours_per_week": 20,
            "specializations": ["Database", "AI"]
        },
        {
            "id": "F003",
            "name": "Dr. Robert Brown",
            "department": "Computer Science",
            "max_hours_per_week": 16,
            "specializations": ["Operating Systems", "Networks"]
        }
    ]
    
    response = requests.post(f"{BASE_URL}/api/faculty/bulk", json=faculty)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def add_rooms():
    print_section("4. ADDING ROOMS")
    rooms = [
        {
            "id": "R101",
            "name": "Room 101",
            "capacity": 60,
            "room_type": "lecture",
            "has_projector": True
        },
        {
            "id": "R102",
            "name": "Room 102",
            "capacity": 70,
            "room_type": "lecture",
            "has_projector": True
        },
        {
            "id": "R103",
            "name": "Room 103",
            "capacity": 65,
            "room_type": "lecture",
            "has_projector": True
        },
        {
            "id": "LAB1",
            "name": "Computer Lab 1",
            "capacity": 50,
            "room_type": "lab",
            "has_projector": True
        }
    ]
    
    response = requests.post(f"{BASE_URL}/api/rooms/bulk", json=rooms)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def add_timeslots():
    print_section("5. ADDING TIME SLOTS")
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    times = [
        ("09:00", "10:00"),
        ("10:00", "11:00"),
        ("11:00", "12:00"),
        ("13:00", "14:00"),
        ("14:00", "15:00"),
        ("15:00", "16:00")
    ]
    
    timeslots = []
    slot_id = 1
    
    for day in days:
        for start, end in times:
            timeslots.append({
                "id": f"T{slot_id:03d}",
                "day": day,
                "start_time": start,
                "end_time": end
            })
            slot_id += 1
    
    response = requests.post(f"{BASE_URL}/api/timeslots/bulk", json=timeslots)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def add_preferences():
    print_section("6. ADDING FACULTY PREFERENCES")
    preferences = [
        {"faculty_id": "F001", "timeslot_id": "T001", "preference_level": 5},  # Mon 9-10
        {"faculty_id": "F001", "timeslot_id": "T002", "preference_level": 5},  # Mon 10-11
        {"faculty_id": "F001", "timeslot_id": "T007", "preference_level": 4},  # Tue 9-10
        {"faculty_id": "F002", "timeslot_id": "T013", "preference_level": 5}, # Wed 9-10
        {"faculty_id": "F002", "timeslot_id": "T014", "preference_level": 5}, # Wed 10-11
        {"faculty_id": "F003", "timeslot_id": "T019", "preference_level": 5}, # Thu 9-10
        {"faculty_id": "F003", "timeslot_id": "T025", "preference_level": 4}, # Fri 9-10
    ]
    
    response = requests.post(f"{BASE_URL}/api/preferences/bulk", json=preferences)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def check_status():
    print_section("7. SYSTEM STATUS CHECK")
    response = requests.get(f"{BASE_URL}/api/system/status")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def generate_schedule(population_size=100, generations=100, use_learning=True):
    print_section(f"8. GENERATING TIMETABLE")
    print(f"Population: {population_size}, Generations: {generations}, Learning: {use_learning}")
    
    request_data = {
        "population_size": population_size,
        "generations": generations,
        "use_learning": use_learning
    }
    
    print("\nStarting generation... (this may take 10-30 seconds)")
    start_time = time.time()
    
    response = requests.post(
        f"{BASE_URL}/api/schedule/generate",
        json=request_data
    )
    
    elapsed = time.time() - start_time
    
    print(f"\nCompleted in {elapsed:.2f} seconds")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        print(f"\n{'='*60}")
        print(f"FINAL FITNESS SCORE: {result['fitness_score']:.4f}")
        print(f"{'='*60}")
        
        print("\nGeneration Statistics:")
        stats = result['generation_stats']
        print(f"  - Initial Best Fitness: {stats['best_fitness_per_generation'][0]:.4f}")
        print(f"  - Final Best Fitness: {stats['best_fitness_per_generation'][-1]:.4f}")
        print(f"  - Improvement: {stats['best_fitness_per_generation'][-1] - stats['best_fitness_per_generation'][0]:.4f}")
        
        print("\nGenerated Timetable:")
        print(f"{'='*60}")
        for i, entry in enumerate(result['schedule'], 1):
            print(f"{i}. {entry['course_name']}")
            print(f"   Faculty: {entry['faculty_name']}")
            print(f"   Room: {entry['room_name']}")
            print(f"   Time: {entry['day']} {entry['start_time']}-{entry['end_time']}")
            print()
        
        return result['fitness_score']
    else:
        print(f"Error: {response.text}")
        return None

def view_learned_patterns():
    print_section("9. VIEWING LEARNED PATTERNS")
    response = requests.get(f"{BASE_URL}/api/learning/patterns")
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\nTotal Pattern Count: {result['pattern_count']}")
    print("\nTop Learned Patterns:")
    for i, pattern in enumerate(result['patterns'][:10], 1):
        print(f"{i}. Type: {pattern['type']}, Strength: {pattern['strength']}")
        if pattern['type'] == 'course_faculty':
            print(f"   Course: {pattern['course']}, Faculty: {pattern['faculty']}")
        elif pattern['type'] == 'course_faculty_timeslot':
            print(f"   Course: {pattern['course']}, Faculty: {pattern['faculty']}, Timeslot: {pattern['timeslot']}")

def main():
    print("\n" + "="*60)
    print("  AI TIMETABLE SCHEDULING SYSTEM - COMPLETE TEST")
    print("="*60)
    
    try:
        # Test sequence
        test_health()
        
        # Reset system for clean test
        print_section("RESETTING SYSTEM")
        requests.delete(f"{BASE_URL}/api/system/reset")
        print("System reset complete")
        
        # Add all data
        add_courses()
        add_faculty()
        add_rooms()
        add_timeslots()
        add_preferences()
        check_status()
        
        # Generate schedule multiple times to test learning
        print_section("FIRST GENERATION (No Learning)")
        fitness1 = generate_schedule(population_size=100, generations=50, use_learning=False)
        
        time.sleep(2)
        
        print_section("SECOND GENERATION (With Learning)")
        fitness2 = generate_schedule(population_size=100, generations=50, use_learning=True)
        
        time.sleep(2)
        
        print_section("THIRD GENERATION (With More Learning)")
        fitness3 = generate_schedule(population_size=100, generations=100, use_learning=True)
        
        view_learned_patterns()
        
        # Summary
        print_section("TEST SUMMARY")
        print(f"First Run (No Learning):  {fitness1:.4f}")
        print(f"Second Run (Learning):    {fitness2:.4f}")
        print(f"Third Run (More Learning): {fitness3:.4f}")
        
        if fitness3 and fitness1:
            improvement = fitness3 - fitness1
            print(f"\nImprovement: {improvement:.4f} ({improvement/fitness1*100:.2f}%)")
        
        print("\n" + "="*60)
        print("  TEST COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server!")
        print("Please make sure the server is running:")
        print("  uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()