function parseResume(text) {

    const result = {
        name: null,
        qualification: null,
        experience: null,
        subjects: [],
        expertise: {}
    };


    // -------------------------
    // Clean Resume Text
    // -------------------------

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);


    // -------------------------
    // Extract Name
    // -------------------------

    if (lines.length > 0) {
        result.name = lines[0];
    }


    // -------------------------
    // Extract Qualification
    // -------------------------

    const qualificationMatch = text.match(
        /(M\.Tech|B\.Tech|MCA|BCA|MBA|PhD|Ph\.D)[^\n]*/i
    );

    if (qualificationMatch) {
        result.qualification =
            qualificationMatch[0].trim();
    }


    // -------------------------
    // Extract Experience
    // -------------------------

    const experienceMatch = text.match(
        /(\d+)\s*(years?|yrs?)\s*(of)?\s*(teaching\s*)?experience/i
    );

    if (experienceMatch) {
        result.experience =
            parseInt(experienceMatch[1]);
    }


    // -------------------------
    // Subject Mapping
    // -------------------------

    const subjectMap = {

        "database management systems": "DBMS",

        "dbms": "DBMS",

        "operating systems": "Operating Systems",

        "computer networks": "Computer Networks",

        "data structures": "Data Structures",

        "c++ programming": "C++",

        "c++": "C++",

        "java": "Java",

        "python": "Python"

    };


    // -------------------------
    // Detect Subjects
    // -------------------------

    const lowerText =
        text.toLowerCase();

    const detectedSubjects =
        new Set();


    for (const keyword in subjectMap) {

        if (lowerText.includes(keyword)) {

            detectedSubjects.add(
                subjectMap[keyword]
            );

        }

    }


    result.subjects =
        Array.from(detectedSubjects);


    // -------------------------
    // Get Subjects & Expertise
    // -------------------------

    const startIndex =
        lowerText.indexOf("subjects & expertise");

    const endIndex =
        lowerText.indexOf("teaching preferences");


    let expertiseText = text;


    if (startIndex !== -1) {

        if (endIndex !== -1) {

            expertiseText =
                text.substring(
                    startIndex,
                    endIndex
                );

        } else {

            expertiseText =
                text.substring(startIndex);

        }

    }


    const lowerExpertiseText =
        expertiseText.toLowerCase();


    // -------------------------
    // Subject Aliases
    // -------------------------

    const subjectAliases = {

        "DBMS": [
            "database management systems (dbms)",
            "database management systems",
            "dbms"
        ],

        "Operating Systems": [
            "operating systems"
        ],

        "Computer Networks": [
            "computer networks"
        ],

        "Data Structures": [
            "data structures"
        ],

        "C++": [
            "c++ programming",
            "c++"
        ],

        "Java": [
            "java"
        ],

        "Python": [
            "python"
        ]

    };


    // -------------------------
    // Expertise Levels
    // -------------------------

    const expertiseLevels = [
        "Advanced",
        "Intermediate",
        "Beginner"
    ];


    // -------------------------
    // Find Expertise
    // -------------------------

    for (const subject of result.subjects) {

        const aliases =
            subjectAliases[subject] || [subject];


        let foundLevel = null;


        for (const alias of aliases) {

            const escapedAlias =
                alias.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            /*
             * Allow spaces or punctuation
             * between subject and expertise.
             *
             * Examples:
             *
             * DBMSAdvanced
             * DBMS Advanced
             * DBMS)Advanced
             * C++ ProgrammingAdvanced
             */

            const regex =
                new RegExp(
                    escapedAlias +
                    "[\\s\\):\\-]*" +
                    "(Advanced|Intermediate|Beginner)",
                    "i"
                );


            const match =
                lowerExpertiseText.match(regex);


            if (match) {

                const level =
                    match[1].toLowerCase();


                if (level === "advanced") {
                    foundLevel = "Advanced";
                }

                else if (level === "intermediate") {
                    foundLevel = "Intermediate";
                }

                else if (level === "beginner") {
                    foundLevel = "Beginner";
                }


                break;
            }

        }


        if (foundLevel) {

            result.expertise[subject] =
                foundLevel;

        }

    }


    // -------------------------
    // Default Missing Expertise
    // -------------------------

    for (const subject of result.subjects) {

        if (!result.expertise[subject]) {

            result.expertise[subject] =
                "Intermediate";

        }

    }


    // -------------------------
    // Return Result
    // -------------------------

    return result;
}


module.exports = parseResume;