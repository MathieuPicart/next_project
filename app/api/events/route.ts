import Event from "@/database/event.model";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();
        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch {
            return NextResponse.json({ message: 'Invalid form-data entries' }, { status: 400 });
        }

        const rawTags = formData.get('tags');
        const rawAgenda = formData.get('agenda');

        let tags: string[] = [];
        let agenda: string[] = [];

        try {
            tags = rawTags ? JSON.parse(String(rawTags)) : [];
            agenda = rawAgenda ? JSON.parse(String(rawAgenda)) : [];
        } catch {
            return NextResponse.json({ message: 'Invalid JSON data format' }, { status: 400 });
        }

        // const file = formData.get('image') as File;

        // if(!file) return NextResponse.json({ message: 'Image file is required'}, { status: 400});

        // const arrayBuffer = await file.arrayBuffer();
        // const buffer = Buffer.from(arrayBuffer);

        // const uploadResult = await new Promise((resolve, reject) => {
        //     cloudinary.uploader.upload_stream({ ressource_type: 'image', folder: 'DevEvent' }, (error, results) => {
        //         if (error) return reject(error);

        //         resolve(results);
        //     })
        // })

        // event.image = (uploadResult as { secure_url: string}).secure_url;

        const fields = ['title', 'slug', 'description', 'overview', 'image', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];

        // Validate required fields
         const missingFields = fields.filter(field => !formData.has(field) || !formData.get(field));
         if (missingFields.length > 0) {
             return NextResponse.json(
                 { message: `Missing required fields: ${missingFields.join(', ')}` },
                 { status: 400 }
             );
         }
 
         // Whitelist and extract allowed fields
         const eventData: Record<string, unknown> = {};
         fields.forEach(field => {
             const value = formData.get(field);
             if (value !== null) {
                 eventData[field] = value;
             }
         });
 
         // Validate slug format (reuse SLUG_REGEX from [slug] route if available)
         const slug = String(eventData.slug).trim().toLowerCase();
         const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
         if (!SLUG_REGEX.test(slug)) {
             return NextResponse.json(
                 { message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
                 { status: 400 }
             );
         }
         eventData.slug = slug;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda
        });
        return NextResponse.json({ message: 'Event created successfully', event: createdEvent}, { status: 201 });
    } catch (e) {
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status : 500 });
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1});

        return NextResponse.json({ message: 'Events fetched successfully', events }, {status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Event fetching failed', error: e }, { status: 500 })
    }
}