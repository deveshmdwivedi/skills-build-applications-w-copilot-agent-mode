import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeObjectId(value: unknown, label: string) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(value);
}

function normalizeMinutes(value: unknown): number {
  const minutes = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new HttpError(400, 'Activity minutes must be a positive number');
  }
  return minutes;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw new HttpError(400, 'Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input;
  const cleanType = typeof type === 'string' ? type.trim() : '';

  if (!cleanType) {
    throw new HttpError(400, 'Activity type is required');
  }

  const userObjectId = normalizeObjectId(userId, 'userId');
  const teamObjectId = normalizeObjectId(teamId, 'teamId');

  if (!(await User.exists({ _id: userObjectId }))) {
    throw new HttpError(400, 'User not found');
  }

  if (!(await Team.exists({ _id: teamObjectId }))) {
    throw new HttpError(400, 'Team not found');
  }

  const points = normalizeMinutes(minutes);
  const activity = await Activity.create({
    user: userObjectId,
    team: teamObjectId,
    type: cleanType,
    minutes: points,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw new HttpError(400, 'Team payload is required');
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  const rawMembers = Array.isArray(input.members) ? input.members : [];

  if (!name || !mascot) {
    throw new HttpError(400, 'Team name and mascot are required');
  }

  const members = rawMembers.map((member) => normalizeObjectId(member, 'member'));

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = typeof userEmail === 'string' ? userEmail.trim() : '';
  if (!email) {
    throw new HttpError(400, 'User email is required');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim() ? user.fitnessGoal.trim() : (recentActivity?.type ?? 'endurance');

  const workouts = await Workout.find().sort({ title: 1 }).lean();
  const prioritized = workouts
    .map((workout) => {
      let score = 0;
      if (workout.focus === preferredFocus) score += 10;
      if (recentActivity && workout.focus === recentActivity.type) score += 5;
      return { ...workout, score };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const topWorkout = prioritized[0];
  if (!topWorkout) {
    throw new HttpError(404, 'No workouts available');
  }

  const reason = recentActivity
    ? `Your recent ${recentActivity.type} activity and ${preferredFocus} goal suggest ${topWorkout.focus} training.`
    : `Your ${preferredFocus} goal suggests ${topWorkout.focus} training.`;

  return [{
    title: topWorkout.title,
    focus: topWorkout.focus,
    minutes: topWorkout.minutes,
    difficulty: topWorkout.difficulty,
    reason,
  }];
}

export { User };
