import assert from 'node:assert/strict'
import { isExamDateExpired, migrateSettings, suggestedExamDate } from '../src/examDate.ts'

const after2026Exam = new Date(2026, 7, 11, 12)
assert.equal(suggestedExamDate(after2026Exam), '2027-07-03T10:30')
assert.deepEqual(
  migrateSettings({examDate:'2026-07-04T10:30',schemaVersion:1}, after2026Exam),
  {examDate:'2027-07-03T10:30',schemaVersion:2},
)

const customExpired = {examDate:'2026-06-20T09:00',schemaVersion:2}
assert.deepEqual(migrateSettings(customExpired, after2026Exam), customExpired)
assert.equal(isExamDateExpired(customExpired.examDate, after2026Exam.getTime()), true)
assert.equal(isExamDateExpired('2027-07-03T10:30', after2026Exam.getTime()), false)

console.log('学考日期策略检查通过')
