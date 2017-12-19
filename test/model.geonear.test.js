'use strict';

var start = require('./common');
var assert = require('power-assert');
var mongoose = start.mongoose;
var Schema = mongoose.Schema;

/**
 * Setup
 */

var testLocations = {
  MONGODB_NYC_OFFICE: [-73.987732, 40.757471],
  BRYANT_PART_NY: [-73.983677, 40.753628],
  EAST_HARLEM_SHOP: [-73.93831, 40.794963],
  CENTRAL_PARK_ZOO: [-73.972299, 40.767732],
  PORT_AUTHORITY_STATION: [-73.990147, 40.757253]
};

// convert meters to radians for use as legacy coordinates
function metersToRadians(m) {
  return m / (6371 * 1000);
}

describe('model', function() {
  var schema = new Schema({
    coordinates: {type: [Number]},
    type: String,
    priority: Number
  });
  schema.index({ coordinates: '2dsphere' }, { background: false });
  var db;

  before(function() {
    db = start();
  });

  after(function(done) {
    db.close(done);
  });

  var count = 0;
  function getModel(db) {
    ++count;
    return db.model('GeoNear' + count, schema, 'geonear' + count);
  }

  var mongo24_or_greater = false;
  before(function(done) {
    start.mongodVersion(function(err, version) {
      if (err) throw err;
      mongo24_or_greater = version[0] > 2 || (version[0] === 2 && version[1] >= 4);
      if (!mongo24_or_greater) console.log('not testing mongodb 2.4 features');
      done();
    });
  });

  describe('geoNear', function() {
    beforeEach(function() {
      if (!mongo24_or_greater) {
        this.skip();
      }
    });

    it('works with legacy coordinate points', function(done) {
      var Geo = getModel(db);
      assert.ok(Geo.geoNear instanceof Function);

      Geo.init().then(function() {
        var geos = [];
        geos[0] = new Geo({
          coordinates: testLocations.MONGODB_NYC_OFFICE,
          type: 'Point'
        });
        geos[1] = new Geo({
          coordinates: testLocations.BRYANT_PARK_NY,
          type: 'Point'
        });
        geos[2] = new Geo({
          coordinates: testLocations.EAST_HARLEM_SHOP,
          type: 'Point'
        });
        geos[3] = new Geo({
          coordinates: testLocations.CENTRAL_PARK_ZOO,
          type: 'Point'
        });
        var count = geos.length;

        for (var i = 0; i < geos.length; i++) {
          geos[i].save(function(err) {
            assert.ifError(err);
            --count || next();
          });
        }

        function next() {
          // using legacy coordinates -- maxDistance units in radians
          var options = {spherical: true, maxDistance: metersToRadians(300)};
          Geo.geoNear(testLocations.PORT_AUTHORITY_STATION, options).then(function(results) {
            assert.equal(1, results.length);

            assert.equal(results[0].obj.type, 'Point');
            assert.equal(results[0].obj.coordinates.length, 2);
            assert.equal(results[0].obj.coordinates[0], testLocations.MONGODB_NYC_OFFICE[0]);
            assert.equal(results[0].obj.coordinates[1], testLocations.MONGODB_NYC_OFFICE[1]);
            assert.equal(results[0].obj.id, geos[0].id);
            assert.ok(results[0].obj instanceof Geo);
            done();
          });
        }
      });
    });

    it('works with GeoJSON coordinate points', function(done) {
      var Geo = getModel(db);
      assert.ok(Geo.geoNear instanceof Function);

      Geo.init().then(function() {
        var geos = [];
        geos[0] = new Geo({
          coordinates: testLocations.MONGODB_NYC_OFFICE,
          type: 'Point'
        });
        geos[1] = new Geo({
          coordinates: testLocations.BRANT_PARK_NY,
          type: 'Point'
        });
        geos[2] = new Geo({
          coordinates: testLocations.EAST_HARLEM_SHOP,
          type: 'Point'
        });
        geos[3] = new Geo({
          coordinates: testLocations.CENTRAL_PARK_ZOO,
          type: 'Point'
        });
        var count = geos.length;

        for (var i = 0; i < geos.length; i++) {
          geos[i].save(function() {
            --count || next();
          });
        }

        function next() {
          var pnt = {type: 'Point', coordinates: testLocations.PORT_AUTHORITY_STATION};
          Geo.geoNear(pnt, {spherical: true, maxDistance: 300}, function(err, results) {
            assert.ifError(err);

            assert.equal(results.length, 1);

            assert.equal(results[0].obj.type, 'Point');
            assert.equal(results[0].obj.coordinates.length, 2);
            assert.equal(results[0].obj.coordinates[0], testLocations.MONGODB_NYC_OFFICE[0]);
            assert.equal(results[0].obj.coordinates[1], testLocations.MONGODB_NYC_OFFICE[1]);
            assert.equal(results[0].obj.id, geos[0].id);
            assert.ok(results[0].obj instanceof Geo);
            done();
          });
        }
      }).catch(done);
    });

    it('works with lean', function(done) {
      var Geo = getModel(db);
      assert.ok(Geo.geoNear instanceof Function);

      Geo.init().then(function() {
        var geos = [];
        geos[0] = new Geo({
          coordinates: testLocations.MONGODB_NYC_OFFICE,
          type: 'Point'
        });
        geos[1] = new Geo({
          coordinates: testLocations.BRANT_PARK_NY,
          type: 'Point'
        });
        geos[2] = new Geo({
          coordinates: testLocations.EAST_HARLEM_SHOP,
          type: 'Point'
        });
        geos[3] = new Geo({
          coordinates: testLocations.CENTRAL_PARK_ZOO,
          type: 'Point'
        });
        var count = geos.length;

        for (var i = 0; i < geos.length; i++) {
          geos[i].save(function() {
            --count || next();
          });
        }

        function next() {
          var pnt = {type: 'Point', coordinates: testLocations.PORT_AUTHORITY_STATION};
          Geo.geoNear(pnt, {spherical: true, maxDistance: 300, lean: true}, function(err, results) {
            assert.ifError(err);

            assert.equal(results.length, 1);

            assert.equal(results[0].obj.type, 'Point');
            assert.equal(results[0].obj.coordinates.length, 2);
            assert.equal(results[0].obj.coordinates[0], testLocations.MONGODB_NYC_OFFICE[0]);
            assert.equal(results[0].obj.coordinates[1], testLocations.MONGODB_NYC_OFFICE[1]);
            assert.equal(results[0].obj._id, geos[0].id);
            assert.ok(!(results[0].obj instanceof Geo));
            done();
          });
        }
      });
    });

    it('throws the correct error messages', function(done) {
      var Geo = getModel(db);

      Geo.init().then(function() {
        var g = new Geo({coordinates: [10, 10], type: 'place'});
        g.save(function() {
          Geo.geoNear('1,2', {}, function(e) {
            assert.ok(e);
            assert.equal(e.message, 'Must pass either a legacy coordinate array or GeoJSON Point to geoNear');

            Geo.geoNear([1], {}, function(e) {
              assert.ok(e);
              assert.equal(e.message, 'If using legacy coordinates, must be an array of size 2 for geoNear');

              Geo.geoNear({type: 'Square'}, {}, function(e) {
                assert.ok(e);
                assert.equal(e.message, 'Must pass either a legacy coordinate array or GeoJSON Point to geoNear');

                Geo.geoNear({type: 'Point', coordinates: '1,2'}, {}, function(e) {
                  assert.ok(e);
                  assert.equal(e.message, 'Must pass either a legacy coordinate array or GeoJSON Point to geoNear');

                  done();
                });
              });
            });
          });
        });
      });
    });

    it('returns a promise (gh-1614)', function(done) {
      var Geo = getModel(db);

      var pnt = {type: 'Point', coordinates: testLocations.PORT_AUTHORITY_STATION};
      // using GeoJSON point
      var prom = Geo.geoNear(pnt, {spherical: true, maxDistance: 300});
      assert.ok(prom instanceof mongoose.Promise);
      prom.catch(() => {});
      done();
    });

    it('allows not passing a callback (gh-1614)', function(done) {
      var Geo = getModel(db);
      Geo.init().then(function() {
        var g = new Geo({coordinates: testLocations.MONGODB_NYC_OFFICE, type: 'Point'});
        g.save(function(err) {
          assert.ifError(err);

          var pnt = {type: 'Point', coordinates: testLocations.PORT_AUTHORITY_STATION};
          var promise;
          assert.doesNotThrow(function() {
            promise = Geo.geoNear(pnt, {spherical: true, maxDistance: 300});
          });

          function validate(ret) {
            assert.equal(ret.length, 1);
            assert.equal(ret[0].obj.coordinates[0], testLocations.MONGODB_NYC_OFFICE[0]);
            assert.equal(ret[0].obj.coordinates[1], testLocations.MONGODB_NYC_OFFICE[1]);
          }

          function finish() {
            done();
          }

          promise.then(validate, assert.ifError).then(finish);
        });
      });
    });

    it('promise fulfill even when no results returned', function(done) {
      var Geo = getModel(db);
      Geo.init().then(function() {
        var g = new Geo({coordinates: [1, 1], type: 'Point'});
        g.save(function(err) {
          assert.ifError(err);

          var pnt = {type: 'Point', coordinates: [90, 45]};
          var promise;
          assert.doesNotThrow(function() {
            promise = Geo.geoNear(pnt, {spherical: true, maxDistance: 1000});
          });

          function finish() {
            done();
          }

          promise.then(finish);
        });
      });
    });

    it('casts (gh-5765)', function(done) {
      var Geo = getModel(db);
      Geo.init().then(function() {
        var g = new Geo({coordinates: [1, 1], type: 'Point', priority: 1});
        g.save(function(error) {
          assert.ifError(error);
          var opts = {
            maxDistance: 1000,
            query: { priority: '1' },
            spherical: true
          };
          Geo.geoNear([1, 1], opts, function(error, res) {
            assert.ifError(error);
            assert.equal(res.length, 1);
            assert.equal(res[0].obj.priority, 1);
            done();
          });
        });
      });
    });
  });
});
