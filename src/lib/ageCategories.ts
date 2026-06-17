import { differenceInYears } from 'date-fns'

export const AGE_CATEGORIES = ['U10', 'U15', 'Open'] as const
export type AgeCategory = (typeof AGE_CATEGORIES)[number]

export function getAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  return differenceInYears(new Date(), d)
}

export function getAgeCategory(dob: string | null | undefined): AgeCategory | null {
  const age = getAge(dob)
  if (age === null) return null
  if (age <= 10) return 'U10'
  if (age <= 15) return 'U15'
  return 'Open'
}
