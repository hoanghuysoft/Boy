export const enrichProfileData = async (birthday: string) => {
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return null;

    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    return {
        dayOfWeek: getDayOfWeek(date),
        daysLived: getDaysLived(date),
        moonPhase: getMoonPhase(year, month, day),
        historicalEvent: await getHistoricalEvent(month, day),
        zodiacSign: calculateZodiacSign(birthday),
        chineseZodiac: getChineseZodiac(date.getUTCFullYear()),
        lifePathNumber: calculateLifePath(birthday),
        generation: getGeneration(date.getUTCFullYear()),
    };
};

export const calculateZodiacSign = (birthday: string): string => {
    const date = new Date(birthday);
    
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";

    return "Unknown";
};

/**
 * 1. Chinese Zodiac (Based on a 12-year cycle)
 */
const getChineseZodiac = (year: number): string => {
    const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
    // The cycle repeats every 12 years; 1924 was a year of the Rat
    return animals[(year - 1924) % 12];
};

/**
 * 2. Life Path Number (Numerology)
 * Sums all digits of the birthday until a single digit or Master Number (11, 22, 33) is reached.
 */
const calculateLifePath = (birthday: string): number => {
    const digits = birthday.replace(/\D/g, ''); // Get only numbers
    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
        sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return sum;
};

/**
 * 3. Generation Labeling
 */
const getGeneration = (year: number): string => {
    if (year >= 2013) return "Gen Alpha";
    if (year >= 1997) return "Gen Z";
    if (year >= 1981) return "Millennial";
    if (year >= 1965) return "Gen X";
    if (year >= 1946) return "Baby Boomer";
    return "Silent Generation";
};

const getDayOfWeek = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
};

/**
 * 2. Days Lived & Exact Age
 */
const getDaysLived = (birthDate: Date): string => {
    const diff = new Date().getTime() - birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)).toLocaleString();
};

/**
 * 3. Moon Phase (Conway's Algorithm approximation)
 * Returns a string representing the moon phase.
 */
const getMoonPhase = (year: number, month: number, day: number): string => {
    let r = year % 100;
    r %= 19;
    if (r > 9) r -= 19;
    r = ((r * 11) % 30) + month + day;
    if (month < 3) r += 2;
    r = (year < 2000) ? 4 - r : 8.3 - r;
    r = Math.floor(r % 30);
    if (r < 0) r += 30;

    const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    // Map the 30-day cycle to our 8 phases
    const index = Math.floor(r / 3.75) % 8;
    return phases[index];
};

/**
 * 4. Historical "On This Day"
 * Uses the Wikimedia API (Free, no API key required)
 */
const getHistoricalEvent = async (month: number, day: number): Promise<string> => {
    try {
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${paddedMonth}/${paddedDay}`);
        const data = await response.json();
        // Return the first interesting event found
        return data.events[0]?.text || "A quiet day in history.";
    } catch (error) {
        return "History is still being written...";
    }
};

export const calculateBMI = (heightCm: number, weightKg: number): number => {
    if (heightCm <= 0) return 0;
    const heightMeters = heightCm / 100;
    const bmi = weightKg / (heightMeters * heightMeters);
    return Math.round(bmi * 10) / 10;
};

export const getBMIStatus = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
};