const chai = require('chai');
const chaiHttp = require('chai-http');

const {
    app, runServer, closeServer
} = require('../server');

// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('Recipes', function) {
//activating the server. runServer returns a promis, and we return it but dotion a return runServer
//if we did not return a promise, our test could start before our server.

before(function () {
    return runServer();
});

//after the function is done we want to close the server.

after(function () {
    return closeServer();
});

//next for the test we want to make a request to /recipes endpoint
//and inspect the response object and prove it has the right code and has the right keys in the response object.

it(`should list recipes and their ingredients`, function () {

    // for Mocha tests, when we're dealing with asynchronous operations,
    // we must either return a Promise object or else call a `done` callback
    // at the end of the test. The `chai.request(server).get...` call is asynchronous
    // and returns a Promise, so we just return it.
    return chai.request(app)
        .get('/recipes')
        .then(function (res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            //there is data already in the app at load so we can check that there is something loading
            res.body.length.should.be.at.least(1);
            //this is where it gets tricky. we have and object that is the name of the recipe
            //that object has an array of ingredients
            //so item would be an object like id, name, ingredients
            const expectedKeys = ['id', 'name', 'ingredients'];
            //but do we need to check that ingredients has something in it or do we just leave it be?

            res.body.forEach(function (item) {
                item.should.be.a('object');
                item.should.include.keys(expectedKeys);
            });
        });

});


//make a post request with the endpoint and inspect the response object, the statis code and that it has returned an object id

it('should add an item on Post', function () {
    const newItem = {
        name: 'cookies',
        ingredients: ['milk', 'sugar', 'eggs', 'vanilla']
    };
    return chai.request(app)
        .post('/recipes')
        .send(newItem)
        .then(function (res) {
            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.include.keys('id', 'name', 'ingredients');
            res.body.id.should.not.be.null;

            //if we are assigning an 'id' to the object then it must also be added to the newItem
            //so the next response should be deep to the newItem variable for that key

            res.body.should.deep.equal(Object.assign(newItem, {
                id: res.body.id
            }));
        });

});


//for updating an item we initalize data (why don't we have an id yet?), make a get request so we can get an item to update, add the id to the updateData, make a PUT request with updateData, inspect the response object to ensure it has right status cose and that we get back an updated item with the right data in it.



it('should update items on PUT', function () {
    //construct (initialize) updated data with an updateData variable
    const updateData = {
        name: 'foo',
        ingredients: ['foo', 'bar', 'chocolate']
    };

    return chai.request(app)
        //get the list so we can updated it
        .get('/recipes')
        .then(function (res) {
            updateData.id = res.body[0].id;
            //promise returned with value of response object to be inspected in next .then
            return chai.request(app)
                .put(`/recipes/${updateData.id}`)
                .send(updateData);
        })

    //check the PUT request has right status code and returns updated item

    .then(function (res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.deep.equal(updateData);
    });
});

//get a list item to delete, delete an item and makke sure we get back a status of 204

it('should delete items on DELETE', function () {
    return chai.request(app)
        //need to get it so we have the id. we use the id to delete the item
        .get('/recipes')
        .then(function (res) {
            return chai.request(app)
                .delete(`/recipes/${res.body[0].id}`);
        });
    .then(function (res) {
        res.should.have.status(204);
    });
});

});
