import SerialCalendarView from '@/components/calendar/SerialCalendarView'

/** Activity-by-date calendar (v2). Entry from shop nav. */
export default function ShopInventoryCalendarPage() {
  return (
    <SerialCalendarView
      pageTitle="Rental calendar"
      pageDescription="Anchor a date and Search. Activity lists rentals, returns, and shop maintenance; completed work is not shown as still scheduled."
    />
  )
}
