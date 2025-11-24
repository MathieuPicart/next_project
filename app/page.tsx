import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { staticEvents } from "@/lib/constants"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async ({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) => {
  const params = await searchParams;

  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not set');
  }

  // Build query string from search params
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined) as [string, string][]
  ).toString();

  const response = await fetch(`${BASE_URL}/api/events${queryString ? `?${queryString}` : ''}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const events = data.events || [];
  const pagination = data.pagination;

  // Extract unique tags from all events for filter dropdown
  const allTags = events.reduce((tags: string[], event: { tags: string[] }) => {
    return [...tags, ...event.tags];
  }, []);
  const uniqueTags = Array.from(new Set(allTags)).sort();

  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>
          {params.q ? `Search Results for "${params.q}"` : 'Featured Events'}
          {pagination && ` (${pagination.total} total)`}
        </h3>

        <ul className="events">
          {(events.length > 0 ? events : staticEvents).map((event: { title: string }) => (
            <li key={event.title} className="list-none">
              <EventCard {...event} />
            </li>
          ))}
        </ul>

        {events.length === 0 && params.q && (
          <p className="text-center text-gray-500">
            No events found matching your search. Try different keywords or clear filters.
          </p>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination-info text-center mt-4">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        )}
      </div>
    </section>
  )
}

export default Page