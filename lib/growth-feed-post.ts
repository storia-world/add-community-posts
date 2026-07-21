export type GrowthFeedPostInput = {
  text?: string;
  displayName?: string;
  value: number;
  unit: string;
  reactions: number;
  kudosCount?: number;
  streak?: number;
  profilePhotoURI?: string;
};

export const DEFAULT_PROFILE_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/storia-b8f37.appspot.com/o/profile-images%2FgenericProfileImage01.png?alt=media&token=2c2831ce-9fce-44c8-9d12-ef704809c835';

export const buildGrowthFeedPostData = ({
  text = '',
  displayName = '',
  value,
  unit,
  reactions,
  kudosCount,
  streak,
  profilePhotoURI = DEFAULT_PROFILE_IMAGE,
}: GrowthFeedPostInput) => {
  const offsetMs = getOffsetMsFromValueUnit(value, unit);
  const createdAtDate = new Date(Date.now() - offsetMs);
  const reactionUserIds = Array.from({ length: Math.max(0, Math.floor(reactions || 0)) }, (_, index) => index + 1);
  const earnedBadges = getRandomEligibleBadges(streak, kudosCount);

  return {
    text,
    userId: null,
    displayName,
    profilePhotoURI,
    weekKey: getWeeksSinceEpoch(),
    createdAt: createdAtDate,
    reactionUserIds,
    isFake: true,
    kudosCount,
    streak,
    badges: {
      earnedBadges,
    },
  };
};

const getOffsetMsFromValueUnit = (value: number, unit: string): number => {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const normalizedUnit = unit?.toLowerCase();
  const multiplierMap: Record<string, number> = {
    min: 60 * 1000,
    mins: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    second: 1000,
    seconds: 1000,
  };
  return safeValue * (multiplierMap[normalizedUnit] || multiplierMap.hour);
};

const getRandomEligibleBadges = (streak?: number, kudosCount?: number): string[] => {
  const eligibleBadges: string[] = [];

  if ((streak || 0) >= 2) eligibleBadges.push('theBecoming');
  if ((streak || 0) >= 15) eligibleBadges.push('theMyceliumClub');
  if ((streak || 0) >= 25) eligibleBadges.push('theStorySeeker', 'theTinyJoysClub');
  if ((streak || 0) >= 30) eligibleBadges.push('theVoiceWithin', 'theTortoiseMind');
  if ((streak || 0) >= 35) eligibleBadges.push('theEarlyRiser');
  if ((streak || 0) >= 35) eligibleBadges.push('theRelentless');
  if ((streak || 0) >= 50) eligibleBadges.push('theBerryBlessed', 'theHeartTonic', 'theSeeingStone');
  if ((streak || 0) >= 100) eligibleBadges.push('thePearlWithin');
  if ((kudosCount || 0) > 20) eligibleBadges.push('theLuminary');

  return Array.from(new Set(eligibleBadges));
};

const getWeeksSinceEpoch = () => {
  const date = new Date();
  const timezoneOffsetInMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  const totalMillisecondsSinceEpoch = Date.now() - timezoneOffsetInMilliseconds;
  const millisecondsFromMonday = totalMillisecondsSinceEpoch + 3 * 24 * 60 * 60 * 1000;
  return Math.floor(millisecondsFromMonday / (1000 * 60 * 60 * 24 * 7));
};
