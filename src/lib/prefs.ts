import type { Profile } from "./types";

export type PrefKey = "diets" | "avoid" | "cuisines" | "kitchen" | "inspiration" | "skill";

export const QUESTIONS: { key: PrefKey; label: string; title: string; copy: string; choices: string[]; chips?: boolean }[] = [
  { key: "diets", label: "Preferences", title: "How do you like to eat?", copy: "Select your dietary needs. Choose as many as you like.", choices: ["Vegetarian", "Vegan", "Pescatarian", "High protein", "No preference"] },
  { key: "avoid", label: "Dietary restrictions", title: "Anything you won’t eat?", copy: "Allergies, restrictions, or ingredients you avoid.", choices: ["Dairy", "Gluten", "Nuts", "Shellfish", "Eggs", "Mushrooms", "Nothing to avoid"] },
  { key: "cuisines", label: "Food preferences", title: "Which cuisines do you love?", copy: "Pick the flavors you come back to most.", chips: true, choices: ["Mediterranean", "Mexican", "Japanese", "Indian", "Italian", "Thai", "Middle Eastern", "Korean", "Chinese", "Vietnamese", "Greek", "Caribbean", "French", "Ethiopian", "Spanish", "American"] },
  { key: "kitchen", label: "Kitchen", title: "What’s your kitchen situation?", copy: "We’ll only suggest recipes you can comfortably make.", choices: ["Full kitchen", "Small kitchen", "Dorm or shared kitchen", "Microwave only", "No oven", "Limited equipment"] },
  { key: "inspiration", label: "Inspiration", title: "Where do you find meal inspiration?", copy: "This helps us understand what feels exciting to you.", choices: ["Social media", "Cookbooks", "Friends & family", "Restaurants", "Whatever is in the fridge", "I need inspiration"] },
  { key: "skill", label: "Cooking comfort", title: "How comfortable are you cooking?", copy: "There’s no wrong answer—we’ll meet you at your level.", choices: ["Just starting", "Comfortable with basics", "Confident home cook", "Very experienced"] },
];

export function summary(profile: Profile, key: PrefKey) {
  const v = profile[key];
  return v.length ? v.join(" · ") : "Not set";
}
