'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EventFormData {
    title: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    organizer: string;
    tags: string[];
    agenda: string[];
}

interface EventFormProps {
    initialData?: Partial<EventFormData>;
    isEditing?: boolean;
    eventSlug?: string;
}

export default function EventForm({ initialData, isEditing = false, eventSlug }: EventFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<EventFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        overview: initialData?.overview || '',
        image: initialData?.image || '',
        venue: initialData?.venue || '',
        location: initialData?.location || '',
        date: initialData?.date || '',
        time: initialData?.time || '',
        mode: initialData?.mode || 'offline',
        audience: initialData?.audience || '',
        organizer: initialData?.organizer || '',
        tags: initialData?.tags || [],
        agenda: initialData?.agenda || [],
    });

    const [tagInput, setTagInput] = useState('');
    const [agendaInput, setAgendaInput] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()],
            });
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove),
        });
    };

    const handleAddAgenda = () => {
        if (agendaInput.trim()) {
            setFormData({
                ...formData,
                agenda: [...formData.agenda, agendaInput.trim()],
            });
            setAgendaInput('');
        }
    };

    const handleRemoveAgenda = (index: number) => {
        setFormData({
            ...formData,
            agenda: formData.agenda.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'tags' || key === 'agenda') {
                    formDataToSend.append(key, JSON.stringify(value));
                } else {
                    formDataToSend.append(key, value as string);
                }
            });

            const url = isEditing ? `/api/events/${eventSlug}` : '/api/events';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                body: formDataToSend,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
            }

            // Redirect to events list
            router.push('/admin/events');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Basic Information */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold">Basic Information</h2>

                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                        Event Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="Next.js Conference 2024"
                        required
                        maxLength={100}
                    />
                </div>

                <div>
                    <label htmlFor="overview" className="block text-sm font-medium mb-2">
                        Overview *
                    </label>
                    <textarea
                        id="overview"
                        name="overview"
                        value={formData.overview}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none min-h-[100px]"
                        placeholder="Brief overview of the event..."
                        required
                        maxLength={500}
                    />
                    <p className="text-xs text-light-200 mt-1">{formData.overview.length}/500 characters</p>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Full Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none min-h-[200px]"
                        placeholder="Detailed description of the event..."
                        required
                        maxLength={1000}
                    />
                    <p className="text-xs text-light-200 mt-1">{formData.description.length}/1000 characters</p>
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium mb-2">
                        Image URL *
                    </label>
                    <input
                        type="url"
                        id="image"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="https://images.unsplash.com/..."
                        required
                    />
                </div>
            </div>

            {/* Event Details */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold">Event Details</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium mb-2">
                            Date *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="time" className="block text-sm font-medium mb-2">
                            Time *
                        </label>
                        <input
                            type="time"
                            id="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="mode" className="block text-sm font-medium mb-2">
                        Event Mode *
                    </label>
                    <select
                        id="mode"
                        name="mode"
                        value={formData.mode}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        required
                    >
                        <option value="offline">In-Person</option>
                        <option value="online">Virtual</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="venue" className="block text-sm font-medium mb-2">
                        Venue *
                    </label>
                    <input
                        type="text"
                        id="venue"
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="Tech Hub Convention Center"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-2">
                        Location *
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="San Francisco, CA"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="audience" className="block text-sm font-medium mb-2">
                        Target Audience *
                    </label>
                    <input
                        type="text"
                        id="audience"
                        name="audience"
                        value={formData.audience}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="Developers, Designers, Product Managers"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="organizer" className="block text-sm font-medium mb-2">
                        Organizer *
                    </label>
                    <input
                        type="text"
                        id="organizer"
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleChange}
                        className="bg-dark-200 w-full rounded-lg px-4 py-3 outline-none"
                        placeholder="Tech Events Inc."
                        required
                    />
                </div>
            </div>

            {/* Tags */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold">Tags</h2>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="bg-dark-200 flex-1 rounded-lg px-4 py-3 outline-none"
                        placeholder="Add a tag (e.g., React, JavaScript)"
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        Add Tag
                    </button>
                </div>

                {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                            <div key={tag} className="pill flex items-center gap-2">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Agenda */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold">Agenda</h2>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={agendaInput}
                        onChange={(e) => setAgendaInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAgenda())}
                        className="bg-dark-200 flex-1 rounded-lg px-4 py-3 outline-none"
                        placeholder="Add agenda item (e.g., 9:00 AM - Registration)"
                    />
                    <button
                        type="button"
                        onClick={handleAddAgenda}
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        Add Item
                    </button>
                </div>

                {formData.agenda.length > 0 && (
                    <ul className="space-y-2">
                        {formData.agenda.map((item, index) => (
                            <li key={index} className="flex items-center justify-between bg-dark-200 px-4 py-3 rounded-lg">
                                <span>{item}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAgenda(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                    {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-dark-200 hover:bg-dark-100 px-8 py-3 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
