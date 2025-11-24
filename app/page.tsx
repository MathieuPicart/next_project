import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { staticEvents } from "@/lib/constants"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not set');
  }

  const response = await fetch(`${BASE_URL}/api/events`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const events = data.events || [];

  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <ul className="events" id="events">
          {(events.length > 0 ? events : staticEvents).map((event: { title: string }) => (
            <li key={event.title} className="list-none">
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Page