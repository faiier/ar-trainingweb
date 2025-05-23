export const quizData = [
    // No. 1 index = 0
    {
        question: "เครื่องหล่อที่คุณรับผิดชอบคือเครื่องใด",
        options: ["CS #19", "BAC2045-43", "(70)", "7"],
        correctAnswer: [0],
        model: "../assets/models/b1.glb",
        points: 1,
        feedback: {
            correct: "ชื่อเครื่องหล่อประกอบด้วยตัวย่อ CS และหมายเลขเครื่องที่มีเครื่องหมาย # ตามด้วยตัวเลขเครื่อง",
            incorrect: "ชื่อเครื่องหล่อมีรูปแบบเฉพาะที่แตกต่างจากข้อมูลอื่น"
        },
        onIncorrect: 1
    },
    // No. 2 index = 1
    {
        question: "คุณได้รับมอบหมายให้หล่อล้อรุ่นใด และต้องผลิตล้อให้ได้กี่วงในกะเช้า (มี 2 คำตอบ)",
        options: ["CS #19", "BAC2045-43", "(70)", "7"],
        correctAnswer: [1, 2],
        model: "../assets/models/b1.glb",
        points: 1,
        feedback: {
            correct: "ชื่อรุ่นงานล้อประกอบด้วยชื่อรุ่นล้อ ขนาดล้อ และค่ากึ่งกลางล้อ เช่น BAC2045-43 หมายถึง ชื่อรุ่นล้อ BAC ขนาดล้อคือ 2045 และค่ากึ่งกลางล้อคือ 43 และจำนวน Lot size คือจำนวนล้อที่ต้องผลิตทั้งหมด เช่น (70) หมายถึง จำนวนล้อที่ต้องผลิตทั้งหมด 70 ล้อ",
            incorrect: "ชื่อรุ่นงานมักประกอบด้วยรหัสรุ่น ขนาดล้อ และค่ากึ่งกลางล้อ ลองสังเกตรหัสที่มีลักษณะเฉพาะเจาะจง และจำนวนล้อที่ต้องผลิตทั้งหมดให้ได้ตามเป้าหมายในกะเช้า อยู่ในช่วงเวลา 08.00-17.00"
        },
        onIncorrect: [0]
    },
    // No. 3 index = 2
    {
        question: "ในแต่ละชั่วโมงคุณต้องหล่อล้อให้ได้กี่วงจึงจะตรงตามแผนที่วางไว้",
        options: ["CS #19", "BAC2045-43", "(70)", "7"],
        correctAnswer: [3],
        model: "../assets/models/b1.glb",
        points: 1,
        feedback: {
            correct: "จำนวนวงต่อ 1 ชั่วโมงการผลิต คือจำนวนล้อที่ต้องผลิตให้ได้ภายใน 1 ชั่วโมง เช่น 7 คือต้องผลิตล้อให้ได้ 7 วงต่อ 1 ชั่วโมง",
            incorrect: "ลองพิจารณาแผนการผลิตประจำวันแบ่งออกเป็นกี่ชั่วโมง และต้องผลิตล้อทั้งหมดกี่วงในวันนั้น จากนั้นคำนวณล้อที่ต้องผลิตให้ได้กี่วงต่อชั่วโมง"
        },
        onIncorrect: [1]
    },
    // No. 4 index = 3
    {
        question: "คุณต้องหล่อล้อรุ่น CCD2500-59 ที่เครื่องหล่อใด และต้องผลิตล้อให้ได้กี่วงใน 1 วัน (มี 2 คำตอบ)",
        options: ["CS #25", "(71)", "7", "1"],
        correctAnswer: [0, 1],
        model: "../assets/models/b2.glb",
        points: 1,
        feedback: {
            correct: "CS #25 หมายถึง เครื่องหล่อที่มีชื่อว่า CS และหมายเลขเครื่องคือ 25 และจำนวนล้อที่ต้องผลิตทั้งหมดใน 1 วันเท่ากับ 71 ล้อ",
            incorrect: "ชื่อเครื่องหล่อมักมีรูปแบบเฉพาะที่สามารถสังเกตได้ชัดเจน และการผลิตล้อให้ได้ตามเป้าหมายใน 1 วัน คือ จำนวน Lot size"
        },
        onIncorrect: [2]
    },
    // No. 5 index = 4
    {
        question: "ในกะเช้า คุณต้องหล่อล้อให้ได้กี่วงในแต่ละชั่วโมง",
        options: ["CS #25", "(71)", "7", "1"],
        correctAnswer: [2],
        model: "../assets/models/b2.glb",
        points: 1,
        feedback: {
            correct: "กะเช้าอยู่ในช่วงเวลา 8.00-17.00 น. ดังนั้นต้องผลิตล้อให้ได้ 7 วงต่อชั่วโมงการผลิต และช่วงเวลา 17.00-18.00 คือเวลาทำโอที ที่ต้องผลิตให้ได้ 1 วงต่อชั่วโมง",
            incorrect: "กะเช้าอยู่ในช่วงเวลา 8.00-17.00 น."
        },
        onIncorrect: [3]
    },

];