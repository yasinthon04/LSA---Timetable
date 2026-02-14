import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.schedule.deleteMany();
    await prisma.yearSubject.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.yearGroup.deleteMany();

    // Create Teachers
    const teachers = await Promise.all([
        prisma.teacher.create({ data: { name: 'Sarah Johnson', email: 'sarah@school.edu', color: '#f59e0b' } }),
        prisma.teacher.create({ data: { name: 'Michael Chen', email: 'michael@school.edu', color: '#ef4444' } }),
        prisma.teacher.create({ data: { name: 'Emily Davis', email: 'emily@school.edu', color: '#8b5cf6' } }),
        prisma.teacher.create({ data: { name: 'James Wilson', email: 'james@school.edu', color: '#10b981' } }),
        prisma.teacher.create({ data: { name: 'Lisa Anderson', email: 'lisa@school.edu', color: '#3b82f6' } }),
    ]);

    // Create Subjects
    const subjects = await Promise.all([
        prisma.subject.create({ data: { name: 'Math', color: '#a78bfa', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Science', color: '#f87171', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'English', color: '#fbbf24', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'History', color: '#fb923c', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Social Studies', color: '#67e8f9', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Economics', color: '#c4b5fd', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Religion and Ethics', color: '#6ee7b7', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Nutrition', color: '#fdba74', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Arts and Crafts', color: '#bef264', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Business', color: '#94a3b8', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Spanish', color: '#f0abfc', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Physical Education', color: '#86efac', type: 'MAIN' } }),
        prisma.subject.create({ data: { name: 'Intervention', color: '#fca5a5', type: 'INTERVENTION' } }),
        prisma.subject.create({ data: { name: 'Booster', color: '#93c5fd', type: 'BOOSTER' } }),
    ]);

    // Create Year Groups
    const yearGroups = await Promise.all([
        prisma.yearGroup.create({ data: { name: 'Year 1' } }),
        prisma.yearGroup.create({ data: { name: 'Year 2' } }),
        prisma.yearGroup.create({ data: { name: 'Year 3' } }),
        prisma.yearGroup.create({ data: { name: 'Year 4' } }),
        prisma.yearGroup.create({ data: { name: 'Year 5' } }),
        prisma.yearGroup.create({ data: { name: 'Year 6' } }),
    ]);

    // Assign subjects to year groups
    for (const yearGroup of yearGroups) {
        // Main subjects for all years
        await prisma.yearSubject.createMany({
            data: [
                { yearGroupId: yearGroup.id, subjectId: subjects[0].id }, // Math
                { yearGroupId: yearGroup.id, subjectId: subjects[1].id }, // Science
                { yearGroupId: yearGroup.id, subjectId: subjects[2].id }, // English
                { yearGroupId: yearGroup.id, subjectId: subjects[3].id }, // History
                { yearGroupId: yearGroup.id, subjectId: subjects[12].id }, // Intervention
                { yearGroupId: yearGroup.id, subjectId: subjects[13].id }, // Booster
            ],
        });
    }

    // Create sample schedules for the week (Year 1)
    const y1 = yearGroups[0];
    const schedules = [
        // Monday
        { teacherId: teachers[0].id, subjectId: subjects[3].id, yearGroupId: y1.id, dayOfWeek: 0, startTime: '07:30', endTime: '08:30' },
        { teacherId: teachers[1].id, subjectId: subjects[1].id, yearGroupId: y1.id, dayOfWeek: 0, startTime: '09:30', endTime: '11:00' },
        { teacherId: teachers[0].id, subjectId: subjects[0].id, yearGroupId: y1.id, dayOfWeek: 0, startTime: '09:30', endTime: '10:30' },
        // Tuesday
        { teacherId: teachers[2].id, subjectId: subjects[5].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '07:30', endTime: '08:30' },
        { teacherId: teachers[1].id, subjectId: subjects[1].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '08:30', endTime: '09:30' },
        { teacherId: teachers[0].id, subjectId: subjects[4].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '09:30', endTime: '11:20' },
        { teacherId: teachers[3].id, subjectId: subjects[7].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '13:15', endTime: '14:00' },
        { teacherId: teachers[0].id, subjectId: subjects[0].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '13:15', endTime: '14:15' },
        { teacherId: teachers[2].id, subjectId: subjects[2].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '14:15', endTime: '15:15' },
        { teacherId: teachers[4].id, subjectId: subjects[8].id, yearGroupId: y1.id, dayOfWeek: 1, startTime: '15:15', endTime: '16:15' },
        // Wednesday
        { teacherId: teachers[0].id, subjectId: subjects[0].id, yearGroupId: y1.id, dayOfWeek: 2, startTime: '08:30', endTime: '09:30' },
        // Thursday
        { teacherId: teachers[0].id, subjectId: subjects[3].id, yearGroupId: y1.id, dayOfWeek: 3, startTime: '07:30', endTime: '08:30' },
        { teacherId: teachers[2].id, subjectId: subjects[5].id, yearGroupId: y1.id, dayOfWeek: 3, startTime: '07:30', endTime: '09:00' },
        { teacherId: teachers[4].id, subjectId: subjects[4].id, yearGroupId: y1.id, dayOfWeek: 3, startTime: '07:30', endTime: '09:30' },
        { teacherId: teachers[2].id, subjectId: subjects[2].id, yearGroupId: y1.id, dayOfWeek: 3, startTime: '14:15', endTime: '15:15' },
        // Friday
        { teacherId: teachers[3].id, subjectId: subjects[6].id, yearGroupId: y1.id, dayOfWeek: 4, startTime: '08:30', endTime: '10:30' },
    ];

    await prisma.schedule.createMany({ data: schedules });

    console.log('✅ Seed complete!');
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Year Groups: ${yearGroups.length}`);
    console.log(`   Schedules: ${schedules.length}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
