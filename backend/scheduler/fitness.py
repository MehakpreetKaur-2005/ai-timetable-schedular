"""
Fitness Function for Timetable Evaluation
Evaluates both hard and soft constraints
"""

import logging
from typing import Dict, Set, Tuple
from scheduler.models import Chromosome, Gene, SystemState

logger = logging.getLogger(__name__)


class FitnessEvaluator:
    """
    Evaluates the quality of a timetable solution
    
    Hard Constraints (must be satisfied):
    - No faculty clash (faculty teaching multiple classes at same time)
    - No room clash (room used for multiple classes at same time)
    - Room capacity must accommodate students
    - Faculty workload within limits
    
    Soft Constraints (preferable):
    - Respect faculty preferences for time slots
    - Minimize gaps in faculty schedule
    - Distribute classes evenly across days
    """
    
    def __init__(self, system_state: SystemState):
        self.system_state = system_state
        
        # Weights for different constraint violations
        self.WEIGHT_FACULTY_CLASH = -100  # Critical
        self.WEIGHT_ROOM_CLASH = -100     # Critical
        self.WEIGHT_CAPACITY = -50        # Critical
        self.WEIGHT_WORKLOAD = -30        # Important
        self.WEIGHT_PREFERENCE = 20       # Soft
        self.WEIGHT_GAPS = -10            # Soft
        self.WEIGHT_DISTRIBUTION = 15     # Soft
    
    def evaluate(self, chromosome: Chromosome) -> float:
        """
        Calculate total fitness score for a chromosome
        Higher score = better solution
        """
        score = 100.0  # Start with base score
        
        # Hard constraints
        score += self._check_faculty_clashes(chromosome.genes)
        score += self._check_room_clashes(chromosome.genes)
        score += self._check_room_capacity(chromosome.genes)
        score += self._check_faculty_workload(chromosome.genes)
        
        # Soft constraints
        score += self._evaluate_preferences(chromosome.genes)
        score += self._evaluate_gaps(chromosome.genes)
        score += self._evaluate_distribution(chromosome.genes)
        
        # Normalize to 0-1 range (approximately)
        normalized_score = max(0.0, min(1.0, score / 200.0))
        
        return normalized_score
    
    def _check_faculty_clashes(self, genes: list) -> float:
        """
        Hard Constraint: Faculty cannot teach multiple classes at the same time
        """
        penalty = 0.0
        faculty_schedule: Dict[str, Set[str]] = {}  # faculty_id -> set of timeslot_ids
        
        for gene in genes:
            if gene.faculty_id not in faculty_schedule:
                faculty_schedule[gene.faculty_id] = set()
            
            if gene.timeslot_id in faculty_schedule[gene.faculty_id]:
                # Clash detected!
                penalty += self.WEIGHT_FACULTY_CLASH
                logger.debug(f"Faculty clash: {gene.faculty_id} at {gene.timeslot_id}")
            else:
                faculty_schedule[gene.faculty_id].add(gene.timeslot_id)
        
        return penalty
    
    def _check_room_clashes(self, genes: list) -> float:
        """
        Hard Constraint: Room cannot be used for multiple classes at the same time
        """
        penalty = 0.0
        room_schedule: Dict[str, Set[str]] = {}  # room_id -> set of timeslot_ids
        
        for gene in genes:
            if gene.room_id not in room_schedule:
                room_schedule[gene.room_id] = set()
            
            if gene.timeslot_id in room_schedule[gene.room_id]:
                # Clash detected!
                penalty += self.WEIGHT_ROOM_CLASH
                logger.debug(f"Room clash: {gene.room_id} at {gene.timeslot_id}")
            else:
                room_schedule[gene.room_id].add(gene.timeslot_id)
        
        return penalty
    
    def _check_room_capacity(self, genes: list) -> float:
        """
        Hard Constraint: Room capacity must be sufficient for student strength
        """
        penalty = 0.0
        
        for gene in genes:
            course = self.system_state.get_course(gene.course_id)
            room = self.system_state.get_room(gene.room_id)
            
            if course and room:
                if room.capacity < course.student_strength:
                    # Capacity violation
                    overflow = course.student_strength - room.capacity
                    penalty += self.WEIGHT_CAPACITY * (overflow / 100.0)
                    logger.debug(
                        f"Capacity issue: {course.name} ({course.student_strength} students) "
                        f"in {room.name} (capacity {room.capacity})"
                    )
        
        return penalty
    
    def _check_faculty_workload(self, genes: list) -> float:
        """
        Hard Constraint: Faculty workload should not exceed maximum hours
        """
        penalty = 0.0
        faculty_hours: Dict[str, int] = {}
        
        for gene in genes:
            course = self.system_state.get_course(gene.course_id)
            if course:
                if gene.faculty_id not in faculty_hours:
                    faculty_hours[gene.faculty_id] = 0
                faculty_hours[gene.faculty_id] += course.duration
        
        for faculty_id, hours in faculty_hours.items():
            faculty = self.system_state.get_faculty(faculty_id)
            if faculty and hours > faculty.max_hours_per_week:
                overflow = hours - faculty.max_hours_per_week
                penalty += self.WEIGHT_WORKLOAD * overflow
                logger.debug(
                    f"Workload issue: {faculty.name} has {hours} hours "
                    f"(max {faculty.max_hours_per_week})"
                )
        
        return penalty
    
    def _evaluate_preferences(self, genes: list) -> float:
        """
        Soft Constraint: Respect faculty preferences for time slots
        """
        bonus = 0.0
        
        for gene in genes:
            pref = self.system_state.get_preference(gene.faculty_id, gene.timeslot_id)
            if pref:
                # Scale preference (1-5) to bonus points
                # preference_level 5 = +10 points, 1 = -10 points
                normalized_pref = (pref.preference_level - 3) / 2.0  # Maps to [-1, 1]
                bonus += self.WEIGHT_PREFERENCE * normalized_pref
        
        return bonus
    
    def _evaluate_gaps(self, genes: list) -> float:
        """
        Soft Constraint: Minimize gaps in faculty daily schedule
        Consecutive classes are better than scattered ones
        """
        penalty = 0.0
        
        # Group by faculty and day
        faculty_day_schedule: Dict[Tuple[str, str], list] = {}
        
        for gene in genes:
            timeslot = self.system_state.get_timeslot(gene.timeslot_id)
            if timeslot:
                key = (gene.faculty_id, timeslot.day)
                if key not in faculty_day_schedule:
                    faculty_day_schedule[key] = []
                faculty_day_schedule[key].append(timeslot.start_time)
        
        # Count gaps for each faculty-day combination
        for key, times in faculty_day_schedule.items():
            if len(times) > 1:
                times_sorted = sorted(times)
                # Each non-consecutive pair adds a gap penalty
                gaps = len(times_sorted) - 1
                penalty += self.WEIGHT_GAPS * gaps
        
        return penalty
    
    def _evaluate_distribution(self, genes: list) -> float:
        """
        Soft Constraint: Even distribution of classes across days
        """
        bonus = 0.0
        
        # Count classes per day
        day_counts: Dict[str, int] = {}
        
        for gene in genes:
            timeslot = self.system_state.get_timeslot(gene.timeslot_id)
            if timeslot:
                day_counts[timeslot.day] = day_counts.get(timeslot.day, 0) + 1
        
        if day_counts:
            # Calculate variance - lower variance = better distribution
            avg = sum(day_counts.values()) / len(day_counts)
            variance = sum((count - avg) ** 2 for count in day_counts.values()) / len(day_counts)
            
            # Reward low variance (good distribution)
            bonus = self.WEIGHT_DISTRIBUTION * max(0, 5 - variance)
        
        return bonus
    
    def get_constraint_details(self, chromosome: Chromosome) -> Dict:
        """
        Get detailed breakdown of constraint violations
        Useful for debugging and reporting
        """
        return {
            "faculty_clashes": self._check_faculty_clashes(chromosome.genes),
            "room_clashes": self._check_room_clashes(chromosome.genes),
            "capacity_violations": self._check_room_capacity(chromosome.genes),
            "workload_violations": self._check_faculty_workload(chromosome.genes),
            "preference_score": self._evaluate_preferences(chromosome.genes),
            "gap_penalty": self._evaluate_gaps(chromosome.genes),
            "distribution_score": self._evaluate_distribution(chromosome.genes)
        }