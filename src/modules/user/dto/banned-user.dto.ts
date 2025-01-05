import { IsMongoId } from "class-validator";
import { Types } from "mongoose";




export class BannedUserDTO {
    @IsMongoId()
    userId:Types.ObjectId
}