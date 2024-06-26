import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['profesor', 'alumno'], default: 'alumno' },
    studentDetails: {
        boleta: String,
        carrera: String 
    },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
