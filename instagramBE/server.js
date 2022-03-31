import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import Post from "./dbModal.js";

//APP CONFIG
const app = express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}

const pusher = new Pusher({
  appId: "1189217",
  key: "0b1c5a30c367c0b9cd80",
  secret: "43d658b42cb5813b1e0f",
  cluster: "eu",
  useTLS: true,
});

//MIDDLEWARES
app.use(express.json());
app.use(cors());

//DB CONFIG
const connection_url =
  "mongodb+srv://admin-oussama:azerty@cluster0.ytuhp.mongodb.net/instaDB?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB connected");
  const changeStream = mongoose.connection.collection("posts").watch();

  changeStream.on("change", (change) => {
    console.log("something was changed");
    if (change.operationType === "insert") {
      console.log("trigggering Pusher ***IMG UPLOAD***");
      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("unkown trigger from pusher");
    }
  });
});

//API END POINT
app.get("/", (req, res) => res.status(200).send("hello"));

app.post("/upload", (req, res) => {
  /* const post = new Post({
    caption: "this is my first post",
    user: "oussama",
    image: "hello",
    comments: ["first comment", "second comment"],
  }); */
  const body = req.body;
  Post.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  Post.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//LISTNER
app.listen(port, (req, res) => console.log(`listening on port ${port}`));
