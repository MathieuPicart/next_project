// Type definitions for Event data
export interface Event {
    _id: string;
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt?: string;
    updatedAt?: string;
}

// Type for API responses
export interface EventsApiResponse {
    message: string;
    events: Event[];
}

// Type guard to validate events array
export function isValidEventsArray(data: unknown): data is Event[] {
    if (!Array.isArray(data)) {
        return false;
    }

    // Check if all items have required Event properties
    return data.every(item =>
        item &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.slug === 'string'
    );
}

// Runtime validation for API response
export function validateEventsResponse(data: unknown): Event[] {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
        console.error('Invalid API response: not an object', data);
        return [];
    }

    const response = data as Record<string, unknown>;

    // Check if events property exists
    if (!('events' in response)) {
        console.error('Invalid API response: missing events property', data);
        return [];
    }

    // Validate events is an array
    if (!isValidEventsArray(response.events)) {
        console.error('Invalid API response: events is not a valid array', response.events);
        return [];
    }

    return response.events;
}
