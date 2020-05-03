/**
 * @file Particle of Sphere with position(P) / velocity (V) property
 * @author Xiang Li <xiangl14@illinois.edu>
 */

// Limit for particle radius
const maxRadius = 0.2;
const minRadius = 0.05;

// Box size (Limit of position)
const boxSize = 1;

// Box size (Limit of position)
const maxV = 1;

// Mass of particle
const mass = 1;

// Gravity constant (could be > 10m/s^2)?
var g = -15;

// Drag constant
var d = 0.9;

// Factor affect velocity when collision
var wallHardness = 0.8;

// WebGL requestAnimFrame timeout value (reference webglutil.js)
const timeout = 1/60;

// Stop movement when velocity in all axis below threshold
const stopThreshold = 0.1;

/** Class implementing of Sphere Particle. */
class Particle {

    constructor() {
        // Initialize position
        this.position = vec3.create();
        vec3.random(this.position, boxSize);

        // Initialize velocity
        this.velocity = vec3.fromValues();
        vec3.random(this.velocity, maxV);

        // Initialize color
        this.color = [Math.random(), Math.random(), Math.random()];

        // Initialize timestamp
        this.timestamp = Date.now();

        // Initialize radius
        var init_radius = this.generateRandomRadius();
        console.log("Radius is:", init_radius);
        this.radius = vec3.create();
        vec3.set(this.radius, init_radius, init_radius, init_radius);

        // Initialize acceleration
        this.accel = vec3.fromValues(0, g, 0);

        this.status = true;
    }

    // Return delta (s) between previous timestamp
    // Buggy when switching tab, delta value increases
    updateTimestamp() {
        let newT = Date.now();
        let delta = newT - this.timestamp;
        this.timestamp = newT;
        return delta / 1000
    }

    // Euler integration:
    // Vnew = V * d^t + at
    updateVelocity() {
        console.log("Prev velocity:", this.velocity);
        vec3.scale(this.velocity, this.velocity, Math.pow(d, timeout));
        const at = vec3.create();
        vec3.scale(at, this.accel, timeout);
        vec3.add(this.velocity, this.velocity, at);
        console.log("New velocity:", this.velocity);
    }

    // Pnew = P + vt
    updatePosition() {
        // console.log("Prev position:", this.position);
        let offset = vec3.create();
        vec3.scale(offset, this.velocity, timeout);
        vec3.add(this.position, this.position, offset);
        // console.log("New position:", this.position);
    }

    // Rr = Ri - 2N(Ri * N)
    // Here, Rr = -Ri*wallHardness (when collide on x/y/z wall boundary)
    handleCollision() {
        for (let i = 0; i < this.position.length; ++i) {
            if (this.position[i] < -boxSize || this.position[i] > boxSize) {
                console.log("Before collide:", this.velocity);
                console.log("Collide on", i, "aixs!");
                this.position[i] = this.position[i] < 0 ? -boxSize : boxSize;
                this.velocity[i] = -wallHardness * this.velocity[i];
                console.log("After collide:", this.velocity);
            }
            // Only round-up when hitting the floor
            if(i === 1) {
                this.handleStop();
            }
        }
    }

    // Determine if a particle should stop movement
    handleStop() {
        let cnt = 0;
        for(let i = 0; i < this.velocity.length; ++i) {
            if(Math.abs(this.velocity[i]) < stopThreshold) {
                ++cnt;
            }
        }

        if(cnt === 3) {
            vec3.scale(this.velocity, this.velocity, 0);
            this.status = false;
        }
    }

    generateRandomRadius() {
        return Math.random() * (maxRadius - minRadius) + minRadius;
    }
}