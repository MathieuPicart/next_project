import Event from "@/database/event.model";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch single event by slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug.trim())) {
      return NextResponse.json(
        { message: 'Invalid slug format' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOne({ slug: slug.trim() }).lean();

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Event fetched successfully', event },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update event by slug
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    // Check if event exists
    const existingEvent = await Event.findOne({ slug });
    if (!existingEvent) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    // Define updatable fields (excluding slug as it's auto-generated from title)
    const fields = ['title', 'description', 'overview', 'image', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];

    // Extract and validate fields
    const updateData: Record<string, unknown> = {};
    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null) {
        updateData[field] = value;
      }
    });

    // Parse tags and agenda
    const rawTags = formData.get('tags');
    const rawAgenda = formData.get('agenda');

    try {
      if (rawTags) updateData.tags = JSON.parse(String(rawTags));
      if (rawAgenda) updateData.agenda = JSON.parse(String(rawAgenda));
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON format for tags or agenda' },
        { status: 400 }
      );
    }

    // Update the event (slug will be regenerated from new title if title changed)
    const updatedEvent = await Event.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent
    }, { status: 200 });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json({
      message: 'Event update failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete event by slug
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    // Check if event exists
    const event = await Event.findOne({ slug });
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event has bookings
    const Booking = (await import('@/database/booking.model')).default;
    const bookingCount = await Booking.countDocuments({ eventId: event._id });

    if (bookingCount > 0) {
      return NextResponse.json(
        { message: `Cannot delete event with existing bookings. This event has ${bookingCount} booking${bookingCount > 1 ? 's' : ''}.` },
        { status: 400 }
      );
    }

    await Event.findOneAndDelete({ slug });

    return NextResponse.json({
      message: 'Event deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Event deletion error:', error);
    return NextResponse.json({
      message: 'Event deletion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
