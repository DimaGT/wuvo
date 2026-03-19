// Wuvo v7.0 assessment questions (gender-neutral)

export const ASSESSMENT_QUESTIONS = [
  { id: 1, type: 'radio', section: 'Goals', question: 'What is your primary health optimization goal?', options: ['Increase energy and vitality', 'Improve body composition (muscle gain / fat loss)', 'Enhance athletic performance', 'Optimize hormone levels', 'Improve cognitive function and focus', 'Better sleep and recovery', 'Longevity and disease prevention'] },
  { id: 2, type: 'slider', section: 'Baseline', question: 'On a scale of 1–10, how would you rate your current energy levels throughout the day?', min: 1, max: 10, labels: ['Exhausted', 'Moderate', 'Excellent'] },
  { id: 3, type: 'checkbox', section: 'Symptoms', question: 'Which symptoms have you experienced in the past 6 months? Select all that apply.', options: ['Persistent fatigue or low energy', 'Difficulty building or maintaining muscle', 'Changes in energy or libido', 'Brain fog or difficulty concentrating', 'Poor sleep quality or insomnia', 'Increased body fat (especially abdominal)', 'Mood changes (irritability, depression)', 'Decreased motivation or drive', 'Joint pain or slow recovery', 'Hair or skin changes'] },
  { id: 4, type: 'radio', section: 'Sleep', question: 'How many hours of quality sleep do you typically get per night?', options: ['Less than 5 hours', '5–6 hours', '6–7 hours', '7–8 hours', '8+ hours'] },
  { id: 5, type: 'radio', section: 'Training', question: 'How often do you engage in structured exercise or physical activity?', options: ['Rarely or never', '1–2 times per week', '3–4 times per week', '5–6 times per week', 'Daily'] },
  { id: 6, type: 'radio', section: 'Hormones', question: 'Have you had your hormone levels tested (testosterone, thyroid, etc.) in the past year?', options: ['Yes — levels were normal / optimal', 'Yes — some were low or suboptimal', "Yes — but I'm unsure of the results", 'No — but I\'m interested in testing', 'No — and I\'m not sure if I need it'] },
  { id: 7, type: 'radio', section: 'Diet', question: 'How would you describe your current nutrition habits?', options: ['No structure — eat whatever, whenever', 'Generally healthy but inconsistent', 'Track calories / macros loosely', 'Strict structured meal plan', 'Specific protocol (keto, carnivore, IF, etc.)'] },
  { id: 8, type: 'checkbox', section: 'Interests', question: 'Which optimization protocols are you most interested in? Select all that apply.', options: ['Hormone therapy', 'Peptide or supplement protocols', 'Comprehensive hormone optimization', 'Evidence-based supplementation', 'Precision nutrition planning', 'Advanced recovery protocols', 'Cognitive performance enhancement', 'Longevity / anti-aging interventions'] },
  { id: 9, type: 'radio', section: 'Lifestyle', question: 'What best describes your current stress level?', options: ['Very high — chronically stressed', 'High — frequently overwhelmed', 'Moderate — manageable most days', 'Low — generally relaxed', 'Very low — minimal stress'] },
  { id: 10, type: 'text', section: 'History', question: 'Describe your current health situation and any specific concerns or goals:', placeholder: "e.g., I've been feeling fatigued for 2 years, tried everything, concerned about hormonal imbalance..." },
]

export const SECTION_COLORS = {
  Goals: 'var(--accent)',
  Baseline: 'var(--blue)',
  Symptoms: 'var(--red)',
  Sleep: 'var(--blue-light)',
  Training: 'var(--green)',
  Hormones: 'var(--accent)',
  Diet: 'var(--green)',
  Interests: 'var(--blue)',
  Lifestyle: 'var(--accent2)',
  History: 'var(--text-2)',
}
