"""
Adaptive Genetic Algorithm for Timetable Optimization
"""

import random
import logging
from typing import List, Tuple, Optional
from copy import deepcopy

from scheduler.models import Chromosome, Gene, SystemState
from scheduler.fitness import FitnessEvaluator
from scheduler.learning import LearningEngine

logger = logging.getLogger(__name__)


class GeneticAlgorithm:
    """
    Adaptive Genetic Algorithm Implementation
    
    Features:
    - Adaptive mutation rate (increases when stuck in local optima)
    - Elitism (preserve best solutions)
    - Tournament selection
    - Two-point crossover
    - Learning from historical patterns
    """
    
    def __init__(
        self,
        system_state: SystemState,
        learning_engine: Optional[LearningEngine] = None,
        population_size: int = 100,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
        elite_size: int = 5
    ):
        self.system_state = system_state
        self.learning_engine = learning_engine
        self.population_size = population_size
        self.initial_mutation_rate = mutation_rate
        self.mutation_rate = mutation_rate  # Will be adapted
        self.crossover_rate = crossover_rate
        self.elite_size = elite_size
        
        self.fitness_evaluator = FitnessEvaluator(system_state)
        
        # For adaptive mutation
        self.stagnation_counter = 0
        self.best_fitness_history = []
        
        logger.info(
            f"GA initialized: pop_size={population_size}, "
            f"mutation={mutation_rate}, crossover={crossover_rate}"
        )
    
    def create_random_chromosome(self) -> Chromosome:
        """
        Create a random valid chromosome (initial population)
        """
        genes = []
        
        for course_id in self.system_state.courses.keys():
            # Randomly assign faculty, room, and timeslot
            faculty_id = random.choice(list(self.system_state.faculty.keys()))
            room_id = random.choice(list(self.system_state.rooms.keys()))
            timeslot_id = random.choice(list(self.system_state.time_slots.keys()))
            
            gene = Gene(
                course_id=course_id,
                faculty_id=faculty_id,
                room_id=room_id,
                timeslot_id=timeslot_id
            )
            genes.append(gene)
        
        return Chromosome(genes)
    
    def initialize_population(self) -> List[Chromosome]:
        """
        Create initial population with diversity
        """
        population = []
        
        # Use learning to seed some initial solutions if available
        if self.learning_engine and len(self.learning_engine.history) > 0:
            # Seed 20% of population from learned patterns
            seed_count = min(self.population_size // 5, len(self.learning_engine.history))
            for i in range(seed_count):
                # Get a historical good solution and mutate it slightly
                historical_chromosome, _ = self.learning_engine.history[-(i+1)]
                mutated = self._mutate(deepcopy(historical_chromosome))
                population.append(mutated)
                logger.debug(f"Seeded chromosome from history: {i+1}/{seed_count}")
        
        # Fill rest with random chromosomes
        while len(population) < self.population_size:
            population.append(self.create_random_chromosome())
        
        logger.info(f"Initialized population of {len(population)} chromosomes")
        return population
    
    def evaluate_population(self, population: List[Chromosome]):
        """
        Evaluate fitness for all chromosomes in population
        """
        for chromosome in population:
            chromosome.fitness = self.fitness_evaluator.evaluate(chromosome)
    
    def select_parents(self, population: List[Chromosome], k: int = 3) -> Chromosome:
        """
        Tournament selection
        Select best individual from k random candidates
        """
        tournament = random.sample(population, k)
        winner = max(tournament, key=lambda c: c.fitness)
        return winner
    
    def crossover(self, parent1: Chromosome, parent2: Chromosome):
        """
        Safe two-point crossover
        Falls back to cloning if chromosome too small
        """
        size = len(parent1.genes)

        # 🚨 SAFETY CHECK
        if size < 3 or random.random() > self.crossover_rate:
            return deepcopy(parent1), deepcopy(parent2)

        point1 = random.randint(1, size - 2)
        point2 = random.randint(point1 + 1, size - 1)

        child1_genes = (
            parent1.genes[:point1] +
            parent2.genes[point1:point2] +
            parent1.genes[point2:]
        )

        child2_genes = (
            parent2.genes[:point1] +
            parent1.genes[point1:point2] +
            parent2.genes[point2:]
        )

        return Chromosome(child1_genes), Chromosome(child2_genes)

    
    def mutate(self, chromosome: Chromosome) -> Chromosome:
        """
        Public mutation method
        """
        return self._mutate(chromosome)
    
    def _mutate(self, chromosome: Chromosome) -> Chromosome:
        """
        Mutation operation
        Randomly change genes based on mutation rate
        """
        for gene in chromosome.genes:
            if random.random() < self.mutation_rate:
                # Randomly decide what to mutate
                mutation_type = random.choice(['faculty', 'room', 'timeslot'])
                
                if mutation_type == 'faculty':
                    gene.faculty_id = random.choice(list(self.system_state.faculty.keys()))
                elif mutation_type == 'room':
                    gene.room_id = random.choice(list(self.system_state.rooms.keys()))
                else:  # timeslot
                    gene.timeslot_id = random.choice(list(self.system_state.time_slots.keys()))
        
        return chromosome
    
    def adapt_mutation_rate(self, current_best_fitness: float):
        """
        Adaptive mutation rate mechanism
        Increase mutation when stagnating, decrease when improving
        """
        self.best_fitness_history.append(current_best_fitness)
        
        # Check last 10 generations
        if len(self.best_fitness_history) >= 10:
            recent = self.best_fitness_history[-10:]
            improvement = max(recent) - min(recent)
            
            if improvement < 0.01:  # Stagnation threshold
                self.stagnation_counter += 1
                # Increase mutation rate (up to 0.4)
                self.mutation_rate = min(0.4, self.mutation_rate * 1.1)
                logger.debug(f"Stagnation detected. Mutation rate increased to {self.mutation_rate:.4f}")
            else:
                self.stagnation_counter = 0
                # Gradually return to initial rate
                self.mutation_rate = max(
                    self.initial_mutation_rate,
                    self.mutation_rate * 0.95
                )
    
    def evolve(self, generations: int) -> Tuple[List[Gene], float, dict]:
        """
        Main evolution loop
        
        Returns:
            - Best chromosome genes
            - Best fitness score
            - Generation statistics
        """
        # Initialize population
        population = self.initialize_population()
        self.evaluate_population(population)
        
        # Track statistics
        stats = {
            "best_fitness_per_generation": [],
            "avg_fitness_per_generation": [],
            "mutation_rate_per_generation": []
        }
        
        best_overall = max(population, key=lambda c: c.fitness)
        
        logger.info(f"Starting evolution for {generations} generations")
        
        for gen in range(generations):
            # Sort population by fitness
            population.sort(key=lambda c: c.fitness, reverse=True)
            
            # Track current best
            current_best = population[0]
            if current_best.fitness > best_overall.fitness:
                best_overall = deepcopy(current_best)
                logger.info(f"Gen {gen}: New best fitness = {best_overall.fitness:.4f}")
            
            # Adaptive mutation
            self.adapt_mutation_rate(current_best.fitness)
            
            # Record statistics
            avg_fitness = sum(c.fitness for c in population) / len(population)
            stats["best_fitness_per_generation"].append(current_best.fitness)
            stats["avg_fitness_per_generation"].append(avg_fitness)
            stats["mutation_rate_per_generation"].append(self.mutation_rate)
            
            if gen % 10 == 0:
                logger.info(
                    f"Gen {gen}/{generations}: "
                    f"Best={current_best.fitness:.4f}, "
                    f"Avg={avg_fitness:.4f}, "
                    f"MutRate={self.mutation_rate:.4f}"
                )
            
            # Create new population
            new_population = []
            
            # Elitism: Keep best individuals
            new_population.extend(deepcopy(c) for c in population[:self.elite_size])
            
            # Generate offspring
            while len(new_population) < self.population_size:
                # Select parents
                parent1 = self.select_parents(population)
                parent2 = self.select_parents(population)
                
                # Crossover
                child1, child2 = self.crossover(parent1, parent2)
                
                # Mutation
                child1 = self._mutate(child1)
                child2 = self._mutate(child2)
                
                new_population.extend([child1, child2])
            
            # Trim to population size
            population = new_population[:self.population_size]
            
            # Evaluate new population
            self.evaluate_population(population)
        
        logger.info(
            f"Evolution completed. Final best fitness: {best_overall.fitness:.4f}"
        )
        
        return best_overall.genes, best_overall.fitness, stats