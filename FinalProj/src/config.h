#define _CS418_CONFIG_H

// const int IMAGE_WIDTH = 800;
// const float ASPECT_RADIO = 4/3.f;
const int IMAGE_WIDTH = 800;
const float ASPECT_RADIO = 4/3.f;

const double INF_DOUBLE = std::numeric_limits<double>::infinity();
const double PI = 3.1415926535897932385;

const int NUM_OF_SAMPLES_PER_PIXEL = 50; 
const int RAY_BOUNCE_DEPTH_LIMIT = 60;


char DEFAULT_NAME[11] = "output.ppm";
const int DEFAULT_SPHERE_NUM = 20;

/* For Debug only */
const int DEBUG_IMAGE_WIDTH = 20;
const int DEBUG_IMAGE_HEIGHT = 20;
const int OBJECTS_BOUNDARY = 1;

/*
Todo: 
    0. BVH --done!
    1. Texturing/Square (Creativity) --done! 
    2. Write ppm to file --done!
    3. Convert to png --png++ 
    4. Pass parameters to program for scene customization --done! 
    5. Write README --done!
*/