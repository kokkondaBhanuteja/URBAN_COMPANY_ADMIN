import User, { IUser } from '../database/userModel';
import jwt from 'jsonwebtoken';
import { HydratedDocument } from 'mongoose';

export const registerUser = async (userData: Partial<IUser>): Promise<HydratedDocument<IUser>> => {
    const user = new User(userData);
    await user.save();
    return user;
};

export const loginUser = async (email: string, password?: string, userType?: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (userType && user.userType !== userType) {
        throw new Error('You are not authorized to access this page');
    }

    if(password){
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
    }

    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return { token, user };
};
