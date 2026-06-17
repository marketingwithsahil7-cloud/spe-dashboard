// Academy runs Tuesday=2, Thursday=4, Saturday=6 (getDay() convention: 0=Sun)
export const ACADEMY_DAYS = [2, 4, 6] as const

export function isAcademyDay(date: Date): boolean {
  return (ACADEMY_DAYS as readonly number[]).includes(date.getDay())
}

export function getNextAcademyDay(from: Date): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + 1)
  while (!isAcademyDay(d)) d.setDate(d.getDate() + 1)
  return d
}

export function getPrevAcademyDay(from: Date): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - 1)
  while (!isAcademyDay(d)) d.setDate(d.getDate() - 1)
  return d
}

export function isDateToday(date: Date): boolean {
  const t = new Date()
  return date.toDateString() === t.toDateString()
}

export function getAcademyDaysInMonth(month: number, year: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    if (isAcademyDay(d)) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

/** Returns today if academy day, otherwise the most recent past academy day */
export function getDefaultAttendanceDate(): Date {
  const today = new Date()
  return isAcademyDay(today) ? today : getPrevAcademyDay(today)
}
