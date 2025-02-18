
import { CreateFamilyHistoryRecordDto } from "../dto/request/create-family-history-record.dto";
import { UpdateFamilyHistoryRecordDto } from "../dto/request/update-family-history-record.dto";
import { FamilyHistoryRecord } from "../schema/family-history-record.schema";

// export interface IEventService {
//     getEventById(id: string): Promise<EventResponse>;
//     createEvent(data: CreateEventDto): Promise<EventResponse>;
//     updateEvent(id: string, updateData: UpdateEventDto): Promise<EventResponse>;
//     deleteEvent(id: string): Promise<boolean>;
//   }

export interface IFamilyHistoryRecordsService {
    findById(id: string): Promise<FamilyHistoryRecord | null>;
    create(data: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord>;
    update(id: string, updateData: UpdateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord | null>;
    delete(id: string): Promise<boolean>;
    findAll(): Promise<FamilyHistoryRecord[]>;
    }