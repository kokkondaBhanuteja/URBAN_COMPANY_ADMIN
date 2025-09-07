import mongoose, { Document, Schema } from 'mongoose';
export interface IReview extends Document {
    bookingId: mongoose.Types.ObjectId;
    consumerId: mongoose.Types.ObjectId;
    providerId: mongoose.Types.ObjectId;
    rating: number; // Rating out of 5
    comment?: string; // Optional comment
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
        consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true
    }
);
reviewSchema.index({ providerId: 1 });

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
export default Review;
