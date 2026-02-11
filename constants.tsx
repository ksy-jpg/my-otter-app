
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Scenario, Building, BuildingType } from './types.ts';

export const INITIAL_STATS = {
  grades: 70,
  sanity: 75,
  leadership: 50,
  skills: 50,
  service: 50,
};

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "THE INTENSITY TUG",
    description: "You are going to submit your proposed subject combination. The FOMO for 4H2s is real. What do you do?",
    optionA: {
      text: "THE 4H2 PATH",
      modifiers: { grades: +25, sanity: -30, leadership: +5 },
      feedback: "You have chosen to deep dive into 4 academic subjects. How will you balance your academic adventure with other passion pursuits outside of the classroom?"
    },
    optionB: {
      text: "THE 3H2 + 1H1 PATH",
      modifiers: { grades: -5, sanity: +30, skills: +10 },
      feedback: "Your energy bar is healthy, giving you a few extra hours a week to explore a passion project or deepen your learning. Your path is focused and strategic. How will you choose to spend this time to grow outside of the classroom?"
    }
  },
  {
    id: 2,
    title: "THE EXPECTATION TUG",
    description: "You are finalising your subject combinations. You have a vision for your future, but the people around you have a different view on what you should take. What should you do?",
    optionA: {
      text: "FOLLOW MY OWN VISION",
      modifiers: { leadership: +20, skills: +15, sanity: -10 },
      feedback: "Your excitement to study is your new fuel. You are charting your own path on your 'Academic Adventure'."
    },
    optionB: {
      text: "THE OTHERS' CHOICE",
      modifiers: { grades: +25, sanity: -40, leadership: -10 },
      feedback: "Choosing a path others want for you isn't a 'wrong' choice—it's a complex one. The path might be shared, but the experience of it is still yours to define."
    }
  },
  {
    id: 3,
    title: "THE AMBITION TUG",
    description: "You have been offered a spot in Student Council, and you are deciding to keep or to drop your second CCA.",
    optionA: {
      text: "THE COUNCIL FOCUS (DROP CCA)",
      modifiers: { leadership: +35, skills: -25, service: +10 },
      feedback: "Curation is an act of courage. You are now working towards building a legacy for the student body. You have committed your time to grow and develop the leadership skills in Student Council."
    },
    optionB: {
      text: "THE DOUBLE COMMITMENT (KEEP BOTH)",
      modifiers: { leadership: +15, skills: +15, sanity: -40 },
      feedback: "You are trying to strike a balance between your diverse passions. How might you balance your multiple responsibilities while ensuring your well-being?"
    }
  },
  {
    id: 4,
    title: "THE BOUNDARY TUG",
    description: "You've had a tiring day and struggling to cope yourself. Your friend messages: 'I need to vent, can we talk?'",
    optionA: {
      text: "SAY YES AND LET YOUR FRIEND VENT, EVEN THOUGH YOU ARE FEELING TIRED",
      modifiers: { service: +30, sanity: -40, grades: -20 },
      feedback: "How would you recharge yourself so that your heart for others doesn't come at the cost of your own well-being?"
    },
    optionB: {
      text: "APOLOGISE AND LET YOUR FRIEND KNOW YOU CAN'T TALK TODAY, BUT ASK IF IT'S SOMETHING URGENT. IF NOT, YOU WILL CHECK IN TOMORROW.",
      modifiers: { sanity: +35, grades: +15, service: -10 },
      feedback: "By having an honest conversation with your friend, you are staying supportive while modelling healthy boundaries."
    }
  },
  {
    id: 5,
    title: "THE COURAGE TUG",
    description: "Global Innovation Grant poster spotted. You have zero experience and always follow the safe path.",
    optionA: {
      text: "THE SAFE PATH",
      modifiers: { grades: +10, leadership: -20, skills: -10 },
      feedback: "You are on the safe path. Your horizon remains the same."
    },
    optionB: {
      text: "THE BOLD MOVE (APPLY)",
      modifiers: { leadership: +30, skills: +25, sanity: -15 },
      feedback: "Daring to grow. The unknown is unpredictable but you're in it."
    }
  }
];

export const GRID_SIZE = 12;

export const BUILDINGS: Record<BuildingType, Building> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    name: 'Bulldoze',
    cost: 0,
    popGen: 0,
    incomeGen: 0,
    description: 'Remove a building',
    color: '#ef4444',
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    name: 'Road',
    cost: 10,
    popGen: 0,
    incomeGen: 0,
    description: 'Connect your city',
    color: '#374151',
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    name: 'Home',
    cost: 50,
    popGen: 10,
    incomeGen: 0,
    description: 'Housing for citizens',
    color: '#3b82f6',
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    name: 'Shop',
    cost: 100,
    popGen: 0,
    incomeGen: 20,
    description: 'Generates commerce',
    color: '#eab308',
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    name: 'Factory',
    cost: 150,
    popGen: 0,
    incomeGen: 50,
    description: 'High production output',
    color: '#8b5cf6',
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    name: 'Park',
    cost: 75,
    popGen: 0,
    incomeGen: 5,
    description: 'Lush greenery for citizens',
    color: '#10b981',
  },
};
