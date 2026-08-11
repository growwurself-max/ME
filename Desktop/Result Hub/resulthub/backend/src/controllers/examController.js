const { db, Timestamp } = require('../config/firebase');
const { notFound, badRequest } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { examSchema, examUpdateSchema, examPublishSchema } = require('../validation/schemas');

async function list(req, res) {
  const cid = collegeId(req);
  let query = db.collection('exams').where('college_id', '==', cid);
  
  if (req.query.course_id) query = query.where('course_id', '==', req.query.course_id);
  if (req.query.section_id) query = query.where('section_id', '==', req.query.section_id);
  
  const snapshot = await query.orderBy('exam_date', 'desc').get();
  const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ exams });
}

async function create(req, res) {
  const cid = collegeId(req);
  const payload = examSchema.parse(req.body);

  const sectionDoc = await db.collection('sections').doc(payload.section_id).get();
  if (!sectionDoc.exists || sectionDoc.data().college_id !== cid) {
    throw notFound('Section not found');
  }
  if (sectionDoc.data().course_id !== payload.course_id) {
    throw badRequest('Section does not belong to the selected course');
  }

  const examRef = await db.collection('exams').add({
    college_id: cid,
    name: payload.name,
    type: payload.type,
    exam_date: payload.exam_date,
    course_id: payload.course_id,
    section_id: payload.section_id,
    published: false,
    published_at: null,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  res.status(201).json({ id: examRef.id });
}

async function update(req, res) {
  const cid = collegeId(req);
  const payload = examUpdateSchema.parse(req.body);

  const examRef = db.collection('exams').doc(req.params.id);
  const examDoc = await examRef.get();

  if (!examDoc.exists || examDoc.data().college_id !== cid) {
    throw notFound('Exam not found');
  }

  const updateData = { updated_at: Timestamp.now() };
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.exam_date !== undefined) updateData.exam_date = payload.exam_date;
  if (payload.course_id !== undefined) updateData.course_id = payload.course_id;
  if (payload.section_id !== undefined) updateData.section_id = payload.section_id;

  await examRef.update(updateData);
  res.json({ ok: true });
}

async function remove(req, res) {
  const cid = collegeId(req);
  const examRef = db.collection('exams').doc(req.params.id);
  const examDoc = await examRef.get();

  if (!examDoc.exists || examDoc.data().college_id !== cid) {
    throw notFound('Exam not found');
  }

  if (examDoc.data().published) {
    throw badRequest('Cannot delete a published exam');
  }

  await examRef.delete();
  res.json({ ok: true });
}

async function publish(req, res) {
  const cid = collegeId(req);
  const payload = examPublishSchema.parse(req.body);

  const examRef = db.collection('exams').doc(payload.exam_id);
  const examDoc = await examRef.get();

  if (!examDoc.exists || examDoc.data().college_id !== cid) {
    throw notFound('Exam not found');
  }

  const updateData = {
    published: payload.published,
    published_at: payload.published ? Timestamp.now() : null,
    updated_at: Timestamp.now(),
  };

  await examRef.update(updateData);
  res.json({ ok: true, published: payload.published });
}

module.exports = { list, create, update, remove, publish };
