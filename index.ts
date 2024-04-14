import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import semaphore from "semaphore";
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: "Too many requests from this IP, please try again later.",
  });
const app = express();
app.use(limiter);

const concurrencyLimit = 10; 
const requestSemaphore = semaphore(concurrencyLimit);
dotenv.config();
app.use(express.json());
const PORT: string | undefined = process.env.PORT;
const DB_String: string | undefined = process.env.MONGODB_URI;
if (!PORT || !DB_String) {
  console.error(
    "PORT or MONGODB_URI is not defined in the environment variables."
  );
  process.exit(1);
}

const conn = async () => {
  await mongoose
    .connect(DB_String)
    .then(() => console.log("connected to DB"))
    .catch((err) => console.log(`mongooose error ${err}`));
};
conn();
const testSchema = new mongoose.Schema({
  title: String,
  ticket: { type: Number, default: 0 },
});
const testModal = mongoose.model("overload test", testSchema);
app.get("/all", async (req, res) => {
  try {
    const tickets = await testModal.find();
    res.json({ m: tickets });
  } catch (err) {
    res.json({ m: err });
  }
});
app.post("/tickets", async (req, res) => {
  const { ticket, title } = req.body;
  try {
    const tick = await testModal.create({
      title,
      ticket,
    });
    await tick.save();
    res.json({ m: `successfully posted ${ticket} tickets` });
  } catch (err) {
    res.json({ m: "this is the error from post tickets controller" });
  }
});
// app.post("/book/:id", async (req, res) => {
//     // Acquire a lock
//     requestSemaphore.take(async () => {
//         const tickets = req.body.tickets;
//         const id = req.params.id;
//         try {
//             const check = await testModal.findById(id);
//             if (!check) {
//                 return res.json({ m: `No record found with id ${id}` });
//             }
//             const availableTickets = check.ticket;
//             if (availableTickets < tickets) {
//                 return res.json({ m: `Not enough tickets available` });
//             }
//             await testModal.findByIdAndUpdate(id, { $inc: { ticket: -tickets } });
//             res.json({ m: `successfully booked ${tickets} tickets` });
//         } catch (err) {
//             res.json({ err: `error from book controller ${err}` });
//         } finally {
//             // Release the lock
//             requestSemaphore.leave();
//         }
//     });
// });
app.post("/book/:id", async (req, res) => {
    const tickets = req.body.tickets;
    const id = req.params.id;
    try {
        const result = await testModal.findByIdAndUpdate(id, { $inc: { ticket: -tickets } }, { new: true });
        
        if (!result) {
            return res.json({ m: `No record found with id ${id}` });
        }

        if (result.ticket < 0) {
            await testModal.findByIdAndUpdate(id, { $inc: { ticket: tickets } });
            return res.json({ m: `Not enough tickets available` });
        }

        res.json({ m: `successfully booked ${tickets} tickets` });
    } catch (err) {
        res.json({ err: `error from book controller ${err}` });
    }
});

  
app.listen(PORT, () => console.log(`server started on ${PORT}`));
