import { Document, model, Schema } from 'mongoose'
import { RoleClass } from "./role.model"

/**
 * Object that determines all accesses by entity for an user
 *
 * @export
 * @interface AccessPerimeter
 */
export interface AccessPerimeter {

    /**
     * List of roles assigned to the user for this entity, determining what the user can
     * do in this entity
     *
     * @type {Array<Partial<RoleClass>>}
     * @memberof AccessPerimeter
     */
    roles: Array<Partial<RoleClass>>
}


export class UserClass {
    public name: string
    public email: string
    public password: string
    public phone: string
    public picture: string
    public status: boolean
    public isDisplay: boolean
    public isStaff: boolean
    public perimeter: Array<AccessPerimeter>
    public job: string

    /**
     * Allows the user to sign up. As long as the user has a signup token, they can
     * register in the application. Once signed up, the signup token is deleted. It
     * can never be set again
     *
     * @type {string}
     * @memberof UserClass
     */
    public signupToken: string

    /**
     * Allows the user to reset their password. The password can only be reset if their is
     * a reset token.
     *
     * @type {string}
     * @memberof UserClass
     */
    public resetToken: string

    constructor(user: Partial<UserClass>) {
        this.name = user && user.name || null
        this.email = user && user.email || null
        this.password = user && user.password || null
        this.phone = user && user.phone || null
        this.picture = user && user.picture || null
        this.status = user && user.status || true
        this.isDisplay = user && user.isDisplay || true
        this.isStaff = user && user.isStaff || false
        this.perimeter = user && user.perimeter || []
        this.job = user && user.job || null
        this.signupToken = user && user.signupToken || null
        this.resetToken = user && user.resetToken || null
    }


}

const userSchema = new Schema(
    {
        name: { type: String, default: null },
        email: { type: String, required: true },
        password: { type: String, default: null },
        phone: { type: String },
        picture: { type: String },
        status: { type: Boolean, default: true },
        isDisplay: { type: Boolean, default: true },
        isStaff: { type: Boolean, default: false },
        signupToken: { type: String },
        resetToken: { type: String },
        perimeter: [
            {
                roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }]
            }
        ],
        job: { type: String }
    },
    {
        timestamps: true
    }
)

export interface UserDocument extends UserClass, Document { }

export const User = model<UserDocument>("User", userSchema)
