import { Event } from "../../schema/event.schema";

export class EventDTO {
    createdBy: string;
    eventScope: string;
    eventType: string;
    eventName: string;
    eventDescription: string;
    startDate: Date;
    endDate: Date;
    recurrenceFrequency: string;
    interval: number;
    byDay: string;
    byMonthDay: number;
    recurrenceEnd: Date;
    location: string;

    static map(event: Event) {
        const dto = new EventDTO();
        dto.eventScope = event.eventScope;
        dto.eventType = event.eventType;
        dto.eventName = event.eventName;
        dto.eventDescription = event.eventDescription;
        dto.startDate = event.startDate;
        dto.endDate = event.endDate;
        dto.recurrenceFrequency = event.recurrenceFrequency;
        dto.interval = event.interval;
        dto.byDay = event.byDay;
        dto.byMonthDay = event.byMonthDay;
        dto.recurrenceEnd = event.recurrenceEnd;
        dto.location = event.location;
        return dto;
    }
}

export class EventResponse {
    event: EventDTO;
}