import { Schema } from 'mongoose';

export const ImageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
});

export interface Image {
  url: string;
  publicId: string;
}
