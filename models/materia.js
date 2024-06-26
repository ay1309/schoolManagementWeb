import mongoose from 'mongoose';

const materiaSchema = new mongoose.Schema({
    nombreMateria: { type: String, required: true },
    profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Materia = mongoose.models.Materia || mongoose.model('Materia', materiaSchema);

export default Materia;
