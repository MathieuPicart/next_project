import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';

// Types for route params and payload
type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};


type DBEvent = {
  _id: unknown;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: 'online' | 'offline' | 'hybrid';
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type EventDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: 'online' | 'offline' | 'hybrid';
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Allow lowercase letters, numbers and single hyphens between segments
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * GET /api/events/[slug]
 * Returns a single event by slug.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    // Ensure DB connection is established (cached across requests)
    await connectDB();

     // Await and extract slug from params
     const { slug } = await params;

    if (typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
    }

    const sanitizedSlug = slug.trim().toLowerCase();
    if (!SLUG_REGEX.test(sanitizedSlug)) {
      return NextResponse.json(
        { message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Find event by slug; lean() returns a plain object suitable for JSON
    const event = await Event.findOne({ slug : sanitizedSlug }).lean<DBEvent>();

    // Handle events not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    // Map to a stable, API-safe DTO (avoid exposing _id/ObjectId directly)
    const payload: EventDTO = {
      id: String((event as DBEvent)._id),
      title: event.title,
      slug: event.slug,
      description: event.description,
      overview: event.overview,
      image: event.image,
      venue: event.venue,
      location: event.location,
      date: event.date,
      time: event.time,
      mode: event.mode,
      audience: event.audience,
      agenda: event.agenda,
      organizer: event.organizer,
      tags: event.tags,
      createdAt: new Date(event.createdAt).toISOString(),
      updatedAt: new Date(event.updatedAt).toISOString(),
    };

    // Return successful response with events data
    return NextResponse.json(
      { message: 'Event fetched successfully', event: payload }, 
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching events by slug:', error);
    }

    // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { message: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Return generic error with error message
      return NextResponse.json(
        { message: 'Failed to fetch events', error: error.message },
        { status: 500 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
