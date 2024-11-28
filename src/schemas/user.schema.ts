import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  authForOptions,
  authTypes,
  userRoles,
  userstatus,
} from 'src/utils/Constants/user.constants';

@Schema({
  timestamps: { updatedAt: false },
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, uniqe: true })
  mobileNumber: string;

  @Prop({
    required: true,
    enum: Object.values(userRoles),
    default: userRoles.User,
  })
  role: string;

  @Prop({
    required: true,
    enum: Object.values(userstatus),
    default: userstatus.Offline,
  })
  status: string;

  @Prop({ default: false })
  confirmEmail: Boolean;

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: authTypes,
        },
        authFor: {
          type: String,
          enum: authForOptions,
        },
        value: String,
        expireAt: {
          type: Date,
          default: Date.now() + 10 * 60 * 1000,
        },
        _id: false,
      },
    ],
  })
  authTypes: [
    {
      type: authTypes;
      authFor: authForOptions;
      value: string;
      expireAt?: number;
    },
  ];

  readonly _id: string;
}

const userSchema = SchemaFactory.createForClass(User);

userSchema.virtual('userName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

export const userModel = MongooseModule.forFeature([
  { name: User.name, schema: userSchema },
]);

export type userType = User & Document;
