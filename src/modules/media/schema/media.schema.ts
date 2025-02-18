import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Media {
    @Prop({ required: true, unique: true, index: true })
    mediaId: string;

    @Prop({ 
        type: MongooseSchema.Types.ObjectId, 
        refPath: 'ownerType', 
        required: true 
    })
    ownerId: mongoose.Types.ObjectId;

    @Prop({ required: true, enum: ['Event', 'Member'] })
    ownerType: string;

    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    fileName: string;

    @Prop()
    caption: string;

    @Prop({ required: true })
    mimeType: string;

    @Prop({ required: true })
    size: number;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

// Middleware to generate a unique mediaId using hybrid approach
MediaSchema.pre<MediaDocument>('validate', async function (next) {
    if (!this.mediaId) {
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const uuidSegment = uuidv4().slice(0, 8); // Get a short segment from UUID
            const generatedMediaId = `MED-${timestamp}-${randomPart}-${uuidSegment}`;

            const existingMedia = await (this.constructor as any).findOne({ mediaId: generatedMediaId });

            if (!existingMedia) {
                this.mediaId = generatedMediaId;
                isUnique = true;
            }

            attempts++;
        }

        if (!isUnique) {
            return next(new Error('Failed to generate a unique mediaId after multiple attempts.'));
        }
    }

    next();
});
