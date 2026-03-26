"""
AI-Based Classroom and Timetable Scheduling System
Main FastAPI Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from datetime import datetime

from scheduler.models import (
    Course, Faculty, Room, TimeSlot, FacultyPreference,
    ScheduleRequest, ScheduleResponse, SystemState
)
from scheduler.ga import GeneticAlgorithm
from scheduler.learning import LearningEngine
from scheduler.ai_assistant import AISchedulingAssistant
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from supabase import create_client, Client

# Initialize FastAPI app
app = FastAPI(
    title="AI Timetable Scheduling System",
    description="Intelligent timetable generation using Adaptive Genetic Algorithm",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global system state
settings = get_settings()

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

system_state = SystemState()
learning_engine = LearningEngine()
ai_assistant = AISchedulingAssistant()  # Groq AI integration


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "AI Timetable Scheduling System",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/system/status")
def get_system_status(user_id: str):
    """Get entity counts for a specific user from Supabase"""
    try:
        # Use exact count to avoid fetching all data
        faculty = supabase.table('faculty').select('id', count='exact').eq('user_id', user_id).execute()
        courses = supabase.table('courses').select('id', count='exact').eq('user_id', user_id).execute()
        rooms = supabase.table('rooms').select('id', count='exact').eq('user_id', user_id).execute()
        timeslots = supabase.table('time_slots').select('id', count='exact').eq('user_id', user_id).execute()
        
        # Sections might not exist yet, handle gracefully
        sections_count = 0
        try:
            sections = supabase.table('sections').select('id', count='exact').eq('user_id', user_id).execute()
            sections_count = sections.count or 0
        except Exception:
            pass
            
        return {
            "faculty": faculty.count or 0,
            "courses": courses.count or 0,
            "rooms": rooms.count or 0,
            "time_slots": timeslots.count or 0,
            "sections": sections_count
        }
    except Exception as e:
        logger.error(f"Error fetching system status: {e}")
        return {
            "faculty": 0, "courses": 0, "rooms": 0, "time_slots": 0, "sections": 0
        }


@app.get("/api/sections")
def get_sections(user_id: str):
    """Get all sections for a specific user"""
    try:
        res = supabase.table('sections').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching sections: {e}")
        return []


@app.get("/api/courses")
def get_courses(user_id: str):
    """Get all courses for a specific user"""
    try:
        res = supabase.table('courses').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/faculty")
def get_faculty(user_id: str):
    """Get all faculty for a specific user"""
    try:
        res = supabase.table('faculty').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching faculty: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/rooms")
def get_rooms(user_id: str):
    """Get all rooms for a specific user"""
    try:
        res = supabase.table('rooms').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching rooms: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/timeslots")
def get_timeslots(user_id: str):
    """Get all time slots for a specific user"""
    try:
        res = supabase.table('time_slots').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching timeslots: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/departments")
def get_departments(user_id: str):
    """Get all departments for a specific user"""
    try:
        res = supabase.table('departments').select('*').eq('user_id', user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching departments: {e}")
        raise HTTPException(status_code=400, detail=str(e))


class BulkSyncRequest(BaseModel):
    items: List[Dict]
    user_id: Optional[str] = None


@app.post("/api/departments/bulk")
def add_departments(req: BulkSyncRequest):
    """Add multiple departments to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for d in req.items:
            data.append({
                "id": d.get('id'),
                "name": d.get('name'),
                "code": d.get('code'),
                "user_id": req.user_id
            })
        
        supabase.table('departments').upsert(data).execute()
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing departments: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/courses/bulk")
def add_courses(req: BulkSyncRequest):
    """Add multiple courses to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for c in req.items:
            data.append({
                "id": c.get('id'),
                "name": c.get('name'),
                "weekly_hours": c.get('weekly_hours') or c.get('duration'),
                "student_strength": c.get('student_strength') or 60,
                "is_lab": c.get('requires_lab', False) or c.get('is_lab', False),
                "subject_code": c.get('subject_code'),
                "theory_hours": c.get('theory_hours'),
                "lab_hours": c.get('lab_hours'),
                "user_id": req.user_id
            })
        
        logger.info(f"SYNC DEBUG (Courses): user={req.user_id}, count={len(req.items)}, sample={data[0] if data else 'empty'}")
        supabase.table('courses').upsert(data).execute()
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing courses: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/faculty/bulk")
def add_faculty(req: BulkSyncRequest):
    """Add multiple faculty members to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for f in req.items:
            data.append({
                "id": f.get('id'),
                "name": f.get('name'),
                "email": f.get('email') or '',
                "department": f.get('department') or 'General',
                "max_hours_per_week": f.get('max_hours_per_week') or 20,
                "role": f.get('role') or 'Professor',
                "specializations": f.get('specializations') or [],
                "department_id": f.get('department_id'),
                "user_id": req.user_id
            })
        
        logger.info(f"SYNC DEBUG (Faculty): user={req.user_id}, count={len(req.items)}, sample={data[0] if data else 'empty'}")
        supabase.table('faculty').upsert(data).execute()
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing faculty: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/rooms/bulk")
def add_rooms(req: BulkSyncRequest):
    """Add multiple rooms to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for r in req.items:
            data.append({
                "id": r.get('id'),
                "name": r.get('name'),
                "capacity": r.get('capacity') or 50,
                "type": r.get('type') or r.get('room_type') or 'Classroom',
                "is_lab": r.get('is_lab', False),
                "user_id": req.user_id
            })
        
        logger.info(f"SYNC DEBUG (Rooms): user={req.user_id}, count={len(req.items)}, sample={data[0] if data else 'empty'}")
        supabase.table('rooms').upsert(data).execute()
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing rooms: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/timeslots/bulk")
def add_timeslots(req: BulkSyncRequest):
    """Add multiple time slots to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for t in req.items:
            data.append({
                "id": t.get('id'),
                "day": t.get('day'),
                "start_time": t.get('start_time'),
                "end_time": t.get('end_time'),
                "user_id": req.user_id
            })
        
        supabase.table('time_slots').upsert(data).execute()
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing time slots: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/preferences/bulk")
def add_preferences(req: BulkSyncRequest):
    """Store faculty availability preferences"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        # Store preferences as part of system_state for this user
        logger.info(f"SYNC DEBUG (Preferences): user={req.user_id}, count={len(req.items)}")
        # We store preferences in a simple format - just acknowledge success
        # The preferences are used during schedule generation
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing preferences: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sections/bulk")
def add_sections(req: BulkSyncRequest):
    """Add multiple sections to Supabase with user_id"""
    if not req.user_id:
        raise HTTPException(status_code=401, detail="User ID is required for synchronization")
    try:
        data = []
        for s in req.items:
            data.append({
                "id": s.get('id'),
                "name": s.get('name'),
                "department": s.get('department') or 'General',
                "student_count": s.get('student_count') or 60,
                "user_id": req.user_id
            })
        logger.info(f"SYNC DEBUG (Sections): user={req.user_id}, count={len(req.items)}")
        # Sections table may not exist yet - gracefully handle
        try:
            supabase.table('sections').upsert(data).execute()
        except Exception:
            logger.warning("Sections table may not exist yet, storing in memory")
        return {"status": "success", "count": len(req.items)}
    except Exception as e:
        logger.error(f"Error syncing sections: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/schedule/generate", response_model=ScheduleResponse)
def generate_schedule(request: ScheduleRequest):
    """
    Generate optimal timetable using Adaptive Genetic Algorithm
    """
    try:
        # 1. Sync state with Supabase before generating
        logger.info("Syncing system state with Supabase...")
        if not system_state.sync_with_supabase(supabase):
            raise HTTPException(status_code=500, detail="Failed to sync data from Supabase")

        logger.info(f"Starting schedule generation with {request.population_size} population, "
                   f"{request.generations} generations, AI optimization: {request.use_ai_optimization}")
        
        # Validate system has necessary data
        if not system_state.courses:
            raise HTTPException(status_code=400, detail="No courses defined")
        if not system_state.faculty:
            raise HTTPException(status_code=400, detail="No faculty defined")
        if not system_state.rooms:
            raise HTTPException(status_code=400, detail="No rooms defined")
        if not system_state.time_slots:
            raise HTTPException(status_code=400, detail="No time slots defined")
        
        # Initialize Genetic Algorithm
        ga = GeneticAlgorithm(
            system_state=system_state,
            learning_engine=learning_engine if request.use_learning else None,
            population_size=request.population_size,
            mutation_rate=0.1,  # Initial rate, will adapt
            crossover_rate=0.8
        )
        
        # Run GA optimization
        best_genes, best_fitness, generation_stats = ga.evolve(
            generations=request.generations
        )
        
        # Store successful schedule for learning
        if best_fitness > 0.7:  # Only learn from good schedules
            learning_engine.add_schedule(best_genes, best_fitness)
            logger.info(f"Stored schedule with fitness {best_fitness:.4f} for learning")
        
        # ─── AI OPTIMIZATION LOOP ────────────────────────────────
        ai_optimization_stats = {
            "enabled": request.use_ai_optimization,
            "rounds_run": 0,
            "total_swaps_applied": 0,
            "fitness_before_ai": best_fitness,
            "fitness_after_ai": best_fitness,
            "swap_log": []
        }
        
        if request.use_ai_optimization and best_fitness < 0.95:
            logger.info(f"Starting AI optimization (fitness={best_fitness:.4f}, max rounds={request.ai_optimization_rounds})")
            
            # Prepare available resources for AI
            available_faculty = [
                {"id": f.id, "name": f.name, "max_hours": f.max_hours_per_week}
                for f in system_state.faculty.values()
            ]
            available_rooms = [
                {"id": r.id, "name": r.name, "capacity": r.capacity}
                for r in system_state.rooms.values()
            ]
            available_timeslots = [
                {"id": t.id, "day": t.day, "start_time": t.start_time, "end_time": t.end_time}
                for t in system_state.time_slots.values()
            ]
            
            from scheduler.models import Chromosome, Gene
            from copy import deepcopy
            
            for ai_round in range(request.ai_optimization_rounds):
                logger.info(f"AI optimization round {ai_round + 1}/{request.ai_optimization_rounds}")
                
                # Build the formatted schedule for this round
                formatted_for_ai = []
                for gene in best_genes:
                    course = system_state.courses[gene.course_id]
                    faculty = system_state.faculty[gene.faculty_id]
                    room = system_state.rooms[gene.room_id]
                    timeslot = system_state.time_slots[gene.timeslot_id]
                    formatted_for_ai.append({
                        "course_id": gene.course_id,
                        "course_name": course.name,
                        "faculty_id": gene.faculty_id,
                        "faculty_name": faculty.name,
                        "room_id": gene.room_id,
                        "room_name": room.name,
                        "timeslot_id": gene.timeslot_id,
                        "day": timeslot.day,
                        "start_time": timeslot.start_time,
                        "end_time": timeslot.end_time
                    })
                
                # Get constraint details for the AI
                current_chromosome = Chromosome(list(best_genes))
                current_chromosome.fitness = best_fitness
                constraint_details = ga.fitness_evaluator.get_constraint_details(current_chromosome)
                
                try:
                    # Ask AI for specific swap suggestions
                    swaps = ai_assistant.suggest_schedule_swaps(
                        schedule=formatted_for_ai,
                        fitness_score=best_fitness,
                        constraint_details=constraint_details,
                        available_faculty=available_faculty,
                        available_rooms=available_rooms,
                        available_timeslots=available_timeslots
                    )
                except Exception as e:
                    logger.warning(f"AI swap suggestion failed in round {ai_round + 1}: {e}")
                    break
                
                if not swaps:
                    logger.info(f"AI suggested no swaps in round {ai_round + 1}, stopping optimization")
                    break
                
                # Apply swaps one by one, keeping only those that improve fitness
                round_swaps_applied = 0
                for swap in swaps:
                    idx = swap["entry_index"]
                    field = swap["field"]
                    new_value = str(swap["new_value"])
                    
                    # Validate the new value exists
                    if field == "faculty_id" and new_value not in system_state.faculty:
                        continue
                    if field == "room_id" and new_value not in system_state.rooms:
                        continue
                    if field == "timeslot_id" and new_value not in system_state.time_slots:
                        continue
                    
                    # Create a trial copy with the swap applied
                    trial_genes = deepcopy(best_genes)
                    old_value = getattr(trial_genes[idx], field)
                    setattr(trial_genes[idx], field, new_value)
                    
                    # Evaluate the trial
                    trial_chromosome = Chromosome(trial_genes)
                    trial_fitness = ga.fitness_evaluator.evaluate(trial_chromosome)
                    
                    if trial_fitness > best_fitness:
                        # Accept the swap
                        best_genes = trial_genes
                        best_fitness = trial_fitness
                        round_swaps_applied += 1
                        ai_optimization_stats["total_swaps_applied"] += 1
                        ai_optimization_stats["swap_log"].append({
                            "round": ai_round + 1,
                            "entry_index": idx,
                            "field": field,
                            "old_value": old_value,
                            "new_value": new_value,
                            "reason": swap.get("reason", ""),
                            "fitness_delta": round(trial_fitness - (best_fitness - (trial_fitness - best_fitness)), 4)
                        })
                        logger.info(
                            f"  Swap accepted: [{idx}].{field} = {new_value} "
                            f"(fitness: {trial_fitness:.4f}, reason: {swap.get('reason', 'N/A')})"
                        )
                    else:
                        logger.debug(
                            f"  Swap rejected: [{idx}].{field} = {new_value} "
                            f"(would reduce fitness to {trial_fitness:.4f})"
                        )
                
                ai_optimization_stats["rounds_run"] = ai_round + 1
                
                if round_swaps_applied == 0:
                    logger.info(f"No improving swaps in round {ai_round + 1}, stopping")
                    break
                
                logger.info(f"Round {ai_round + 1}: applied {round_swaps_applied} swaps, fitness now {best_fitness:.4f}")
            
            ai_optimization_stats["fitness_after_ai"] = best_fitness
            improvement = best_fitness - ai_optimization_stats["fitness_before_ai"]
            logger.info(
                f"AI optimization complete: {ai_optimization_stats['total_swaps_applied']} swaps applied, "
                f"fitness {ai_optimization_stats['fitness_before_ai']:.4f} → {best_fitness:.4f} "
                f"(+{improvement:.4f})"
            )
            
            # Store improved schedule for learning
            if improvement > 0 and best_fitness > 0.7:
                learning_engine.add_schedule(best_genes, best_fitness)
        
        # ─── FORMAT RESPONSE ─────────────────────────────────────
        formatted_schedule = []
        for gene in best_genes:
            course = system_state.courses[gene.course_id]
            faculty = system_state.faculty[gene.faculty_id]
            room = system_state.rooms[gene.room_id]
            timeslot = system_state.time_slots[gene.timeslot_id]
            
            formatted_schedule.append({
                "course_id": gene.course_id,
                "course_name": course.name,
                "faculty_id": gene.faculty_id,
                "faculty_name": faculty.name,
                "room_id": gene.room_id,
                "room_name": room.name,
                "timeslot_id": gene.timeslot_id,
                "day": timeslot.day,
                "start_time": timeslot.start_time,
                "end_time": timeslot.end_time
            })
        
        logger.info(f"Schedule generation completed. Final fitness: {best_fitness:.4f}")
        
        # Store for leave/substitution system
        system_state._last_schedule = formatted_schedule
        
        # Get AI analysis of the final schedule
        ai_analysis = None
        try:
            ai_analysis = ai_assistant.analyze_schedule_quality(
                schedule=formatted_schedule,
                fitness_score=best_fitness
            )
            logger.info("AI analysis completed")
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")
        
        return ScheduleResponse(
            schedule=formatted_schedule,
            fitness_score=best_fitness,
            generation_stats=generation_stats,
            metadata={
                "population_size": request.population_size,
                "generations": request.generations,
                "learning_enabled": request.use_learning,
                "ai_analysis": ai_analysis,
                "ai_optimization": ai_optimization_stats,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating schedule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Schedule generation failed: {str(e)}")



@app.get("/api/schedule/history")
def get_schedule_history():
    """Get historical schedule performance data"""
    return {
        "total_schedules": len(learning_engine.history),
        "history": [
            {
                "fitness": fitness,
                "timestamp": datetime.now().isoformat()
            }
            for _, fitness in learning_engine.history[-10:]  # Last 10
        ]
    }


@app.delete("/api/system/reset")
def reset_system():
    """Reset all system data (useful for testing)"""
    global system_state, learning_engine
    system_state = SystemState()
    learning_engine = LearningEngine()
    logger.info("System reset completed")
    return {"status": "success", "message": "System reset completed"}


@app.get("/api/learning/patterns")
def get_learned_patterns():
    """Get learned scheduling patterns"""
    return {
        "pattern_count": learning_engine.get_pattern_count(),
        "patterns": learning_engine.get_top_patterns(limit=20)
    }


@app.post("/api/ai/analyze-faculty-fit")
def analyze_faculty_fit(course_id: str):
    """
    Use AI to analyze which faculty is best suited for a course
    """
    try:
        course = system_state.courses.get(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        faculty_list = [
            {
                "id": f.id,
                "name": f.name,
                "specializations": f.specializations,
                "max_hours_per_week": f.max_hours_per_week
            }
            for f in system_state.faculty.values()
        ]
        
        if not faculty_list:
            raise HTTPException(status_code=400, detail="No faculty available")
        
        result = ai_assistant.analyze_faculty_course_fit(
            course_name=course.name,
            course_details=f"Duration: {course.duration}h, Lab: {course.requires_lab}",
            faculty_list=faculty_list,
            student_strength=course.student_strength
        )
        
        return {
            "course": course.name,
            "ai_recommendation": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI faculty analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-schedule")
def analyze_schedule_with_ai(schedule_data: List[Dict]):
    """
    Use AI to analyze the quality of a generated schedule
    """
    try:
        if not schedule_data:
            raise HTTPException(status_code=400, detail="No schedule provided")
        
        # Calculate a mock fitness score if not provided
        fitness_score = 0.85  # This would come from actual evaluation
        
        result = ai_assistant.analyze_schedule_quality(
            schedule=schedule_data,
            fitness_score=fitness_score
        )
        
        return {
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in AI schedule analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/insights")
def get_ai_insights():
    """
    Get AI insights about the current scheduling problem
    """
    try:
        courses = [
            {
                "id": c.id,
                "name": c.name,
                "student_strength": c.student_strength,
                "duration": c.duration
            }
            for c in system_state.courses.values()
        ]
        
        faculty = [
            {
                "id": f.id,
                "name": f.name,
                "specializations": f.specializations,
                "max_hours": f.max_hours_per_week
            }
            for f in system_state.faculty.values()
        ]
        
        rooms = [
            {
                "id": r.id,
                "name": r.name,
                "capacity": r.capacity,
                "type": r.room_type
            }
            for r in system_state.rooms.values()
        ]
        
        if not courses or not faculty or not rooms:
            return {
                "message": "Insufficient data for analysis",
                "courses": len(courses),
                "faculty": len(faculty),
                "rooms": len(rooms)
            }
        
        insights = ai_assistant.get_scheduling_insights(
            courses=courses,
            faculty=faculty,
            rooms=rooms
        )
        
        return {
            "insights": insights,
            "data_summary": {
                "courses": len(courses),
                "faculty": len(faculty),
                "rooms": len(rooms),
                "time_slots": len(system_state.time_slots)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting AI insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── LEAVE & SUBSTITUTION SYSTEM ──────────────────────────────

# In-memory leave storage
leave_records: List[Dict] = []

class LeaveRequest(BaseModel):
    faculty_id: str
    day: str
    timeslot_id: str
    reason: str = "Personal leave"
    substitute_faculty_id: Optional[str] = None  # None = free period

@app.post("/api/leave/apply")
def apply_leave(req: LeaveRequest):
    """
    Faculty applies for leave on a specific day/period.
    If substitute_faculty_id is provided, validates availability.
    If None, marks as free period.
    """
    try:
        # Validate faculty exists
        if req.faculty_id not in system_state.faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        faculty = system_state.faculty[req.faculty_id]
        
        # Validate timeslot exists
        if req.timeslot_id not in system_state.time_slots:
            raise HTTPException(status_code=404, detail="Time slot not found")
        
        substitute_name = None
        if req.substitute_faculty_id:
            if req.substitute_faculty_id not in system_state.faculty:
                raise HTTPException(status_code=404, detail="Substitute faculty not found")
            
            # Check if substitute is available (not already teaching at that time)
            # Check existing schedule
            if hasattr(system_state, '_last_schedule') and system_state._last_schedule:
                for entry in system_state._last_schedule:
                    if (entry.get('faculty_id') == req.substitute_faculty_id and
                        entry.get('day') == req.day and
                        entry.get('timeslot_id') == req.timeslot_id):
                        raise HTTPException(
                            status_code=409,
                            detail=f"Substitute faculty is already teaching at this time slot"
                        )
            
            # Check if substitute already has leave at that time
            for lr in leave_records:
                if (lr['status'] == 'active' and
                    lr['faculty_id'] == req.substitute_faculty_id and
                    lr['day'] == req.day and
                    lr['timeslot_id'] == req.timeslot_id):
                    raise HTTPException(
                        status_code=409,
                        detail="Substitute faculty is on leave at this time"
                    )
            
            substitute_name = system_state.faculty[req.substitute_faculty_id].name
        
        record = {
            "id": f"leave_{len(leave_records) + 1}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "faculty_id": req.faculty_id,
            "faculty_name": faculty.name,
            "day": req.day,
            "timeslot_id": req.timeslot_id,
            "substitute_faculty_id": req.substitute_faculty_id,
            "substitute_faculty_name": substitute_name,
            "reason": req.reason,
            "status": "active",
            "is_free_period": req.substitute_faculty_id is None,
            "created_at": datetime.now().isoformat()
        }
        
        leave_records.append(record)
        logger.info(f"Leave applied: {faculty.name} on {req.day}, sub: {substitute_name or 'FREE PERIOD'}")
        
        return {"status": "success", "leave": record}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying leave: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leave/all")
def get_all_leaves():
    """Get all leave records (admin view)"""
    return {"leaves": leave_records}


@app.get("/api/leave/faculty/{faculty_id}")
def get_faculty_leaves(faculty_id: str):
    """Get leave records for a specific faculty"""
    faculty_leaves = [lr for lr in leave_records if lr['faculty_id'] == faculty_id and lr['status'] == 'active']
    return {"leaves": faculty_leaves}


@app.delete("/api/leave/{leave_id}")
def cancel_leave(leave_id: str):
    """Cancel a leave record"""
    for lr in leave_records:
        if lr['id'] == leave_id:
            lr['status'] = 'cancelled'
            logger.info(f"Leave cancelled: {leave_id}")
            return {"status": "success", "message": "Leave cancelled"}
    raise HTTPException(status_code=404, detail="Leave record not found")


@app.get("/api/schedule/active")
def get_active_schedule():
    """
    Get the schedule with active substitutions applied.
    Students and teachers see this view.
    """
    if not hasattr(system_state, '_last_schedule') or not system_state._last_schedule:
        return {"schedule": [], "substitutions": []}
    
    schedule = []
    substitutions = []
    
    for entry in system_state._last_schedule:
        modified_entry = dict(entry)
        
        # Check if there's an active leave for this faculty/day/timeslot
        for lr in leave_records:
            if (lr['status'] == 'active' and
                lr['faculty_id'] == entry.get('faculty_id') and
                lr['day'] == entry.get('day') and
                lr['timeslot_id'] == entry.get('timeslot_id')):
                
                if lr['is_free_period']:
                    modified_entry['is_free_period'] = True
                    modified_entry['original_faculty_name'] = entry.get('faculty_name')
                    modified_entry['faculty_name'] = 'FREE PERIOD'
                    modified_entry['faculty_id'] = None
                else:
                    modified_entry['is_substitution'] = True
                    modified_entry['original_faculty_name'] = entry.get('faculty_name')
                    modified_entry['faculty_name'] = lr['substitute_faculty_name']
                    modified_entry['faculty_id'] = lr['substitute_faculty_id']
                
                modified_entry['leave_reason'] = lr['reason']
                substitutions.append({
                    "leave_id": lr['id'],
                    "day": lr['day'],
                    "timeslot_id": lr['timeslot_id'],
                    "original_faculty": entry.get('faculty_name'),
                    "substitute_faculty": lr['substitute_faculty_name'] or 'FREE PERIOD',
                    "course": entry.get('course_name'),
                    "reason": lr['reason']
                })
                break
        
        schedule.append(modified_entry)
    
    return {"schedule": schedule, "substitutions": substitutions}


@app.get("/api/faculty/available")
def get_available_faculty(day: str, timeslot_id: str):
    """
    Get list of faculty who are available at a given day/timeslot.
    A faculty is unavailable if they are:
    1. Already teaching at that time
    2. On leave at that time
    """
    all_faculty = list(system_state.faculty.values())
    busy_ids = set()
    
    # Check who's teaching at that time
    if hasattr(system_state, '_last_schedule') and system_state._last_schedule:
        for entry in system_state._last_schedule:
            if entry.get('day') == day and entry.get('timeslot_id') == timeslot_id:
                busy_ids.add(entry.get('faculty_id'))
    
    # Check who's on leave at that time
    for lr in leave_records:
        if lr['status'] == 'active' and lr['day'] == day and lr['timeslot_id'] == timeslot_id:
            busy_ids.add(lr['faculty_id'])
    
    available = [
        {"id": f.id, "name": f.name, "specializations": f.specializations}
        for f in all_faculty if f.id not in busy_ids
    ]
    
    unavailable = [
        {"id": f.id, "name": f.name}
        for f in all_faculty if f.id in busy_ids
    ]
    
    return {
        "available": available,
        "unavailable": unavailable,
        "day": day,
        "timeslot_id": timeslot_id
    }


@app.get("/api/schedule/teacher/{faculty_id}")
def get_teacher_schedule(faculty_id: str):
    """Get schedule entries for a specific teacher"""
    if faculty_id not in system_state.faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    if not hasattr(system_state, '_last_schedule') or not system_state._last_schedule:
        return {"schedule": [], "faculty_name": system_state.faculty[faculty_id].name}
    
    teacher_entries = []
    for entry in system_state._last_schedule:
        if entry.get('faculty_id') == faculty_id:
            modified_entry = dict(entry)
            # Check for leave/substitution affecting this entry
            for lr in leave_records:
                if (lr['status'] == 'active' and
                    lr['faculty_id'] == faculty_id and
                    lr['day'] == entry.get('day') and
                    lr['timeslot_id'] == entry.get('timeslot_id')):
                    modified_entry['on_leave'] = True
                    modified_entry['substitute'] = lr.get('substitute_faculty_name') or 'FREE PERIOD'
                    break
            teacher_entries.append(modified_entry)
    
    # Also get classes where this teacher is substituting
    sub_entries = []
    for lr in leave_records:
        if lr['status'] == 'active' and lr.get('substitute_faculty_id') == faculty_id:
            for entry in system_state._last_schedule:
                if (entry.get('faculty_id') == lr['faculty_id'] and
                    entry.get('day') == lr['day'] and
                    entry.get('timeslot_id') == lr['timeslot_id']):
                    sub_entries.append({
                        **entry,
                        'is_substitution': True,
                        'original_faculty_name': lr['faculty_name'],
                    })
    
    return {
        "schedule": teacher_entries,
        "substitutions": sub_entries,
        "faculty_name": system_state.faculty[faculty_id].name
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)