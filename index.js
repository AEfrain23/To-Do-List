import express from "express";
import bodyParser from "body-parser"
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true })); // Remember to use body parser you must use this code.

app.use(express.static("public")); // Make sure that static files are linked to and the CSS shows up.


// Creating the new database with mongoose in place of the empty array.
mongoose.connect("mongodb+srv://aefrain23:Efrain230196@todolist-app.r6dzlxb.mongodb.net/todolistDB", { useNewUrlParser: true });


const dailyItemArray = [];

// Creating a new item schema
const itemSchema = new mongoose.Schema({
  name: String
});
// Creating the 'model' of our schema
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Hit the checkbox to delete an item ---->"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "Welcome to your to-do-list!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema);


// Using async in order to create a getItems() function and calling it later in the GET request.
async function getItems() {
  const items = await Item.find({}); // Remember, in order to use await you must use async.
  return items; // This function returns an array of all the data and we assign it the name 'Items'.
}

// Get request, Using the .then method in order to use a call back function in order to carry out the necessary steps once called.
app.get("/", function (req, res) {
  const customListName = req.params.customListName;
  getItems().then(function (FoundItems) {
    if (FoundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("index.ejs", { listTitle: customListName, dailyToDo: FoundItems });
    }
  });
});


// GET REQUEST. Here we are able to input into the route as "http://localhost:3000/<CustomListName>" to create new lists.
app.get("/:customListName", (req, res) => {
  // using lodash to capitalize First letter and lowcase every other. Done so that we can ignore capitalisation when creating new lists.
  const customListName = _.capitalize(req.params.customListName);

  async function findOne() {
    const foundOne = List.findOne({ name: customListName }) // 'foundOne' can be anything
    return foundOne;
  }
  findOne().then(function (foundList) {
    if (!foundList) {
      console.log("doesnt exist");

      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName)
    } else {
      console.log("exists");
      res.render("index.ejs", { listTitle: customListName, dailyToDo: foundList.items })
    }
  });
});



// POST REQUEST: What happens when you press submit.
app.post("/", (req, res) => {
  const toDoInput = req.body["textInput"];
  const listName = req.body["list"];

  const item = new Item({
    name: toDoInput
  });

  if (listName === "") {
    item.save();
    res.redirect("/");
  } else {
    async function findOne() {
      const foundOne = List.findOne({ name: listName }); // 'foundOne' can be anything
      return foundOne;
    }
    findOne().then(function (foundList) {
      console.log(foundList);
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});

// DELETE Request. REVISE!!!!!!!!
app.post("/delete", (req, res) => {
  const checkedItemId = req.body["checkbox"];
  const listName = req.body["listName"]

  if (listName === "") {
    console.log(req.body["checkbox"]);
    Item.deleteOne({ _id: checkedItemId }).then(() => { // Anoynmous function 'then' redirects to home page after deleteOne() is carried out.
      res.redirect("/");
    });
  } else {
    async function findOne() {
      // Here we are using $pull from mongoDB not mongoose.
      const foundOne = List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
      return foundOne;
    };
    findOne().then(function () {
      res.redirect("/" + listName);
    });
  };
});


// This closes the connection must be at the end.
// mongoose.connection.close();

// Boilerplate code.
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});