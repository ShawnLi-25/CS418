/**
    CS 418- Basic Ray Tracer built in C++ 
    Reference: thanks to Peter Shirley’s books on ray tracing & src code

    @author Xiang Li (xiangl14)
    @version 1.0 05/14/20 
*/

#include <iostream>

#include "src/config.h"
#include "src/util.h"
#include "src/bvh.h"
#include "src/scene.h"
#include "src/material.h"
#include "src/camera.h"
#include "src/helper.h"

// #define DEBUG 1

int main(int argc, char* argv[]) {
    int image_width = IMAGE_WIDTH;
    int image_height = static_cast<int>(IMAGE_WIDTH / ASPECT_RADIO);

    #ifdef DEBUG
        image_width = DEBUG_IMAGE_WIDTH;
        image_height = DEBUG_IMAGE_HEIGHT;
    #endif

    if(argc < 4) {
        std::cout << "Parameters required, use default instead!!\n [Usage: ./ray_tracer + num_of_sphere + output_file_name + max_bounce_depth]" << std::endl;
    }

    int num_of_sphere = argv[1] ? atoi(argv[1]) : DEFAULT_SPHERE_NUM; 

    FILE * output_file;
    char* file_name = DEFAULT_NAME;
    if(argc >= 3 && argv[2]) {
        file_name = argv[2];
    }

    int max_depth = RAY_BOUNCE_DEPTH_LIMIT;
    if(argc >= 4 && argv[3]) {
        max_depth = atoi(argv[3]);
    }

    std::cout << "Image size is:" << image_width << "*" << image_height << std::endl;
    std::cout << "Number of Sphere: " << num_of_sphere
    << " Output file name: " << file_name << " Max Depth: " << max_depth << std::endl;
    
    output_file = fopen(file_name, "w");
    fprintf(output_file, "P3\n%d %d\n255\n", image_width, image_height);
 
    Scene my_scene = generate_random_scene(num_of_sphere);

    // Camera configuration
    Vec3 eye_pt(12, 1.8, 9.8), view_dir(0, 0, 0), up(0, 1, 0);
    double fov = 20, focal_len = 10.0, aperture = 0.1;

    Camera my_view(eye_pt, view_dir, up, fov, ASPECT_RADIO, aperture, focal_len);

    for (int j = image_height - 1; j >= 0; --j) {
        for (int i = 0; i < image_width; ++i) {
            Vec3 pixel_color;
            for (int k = 0; k < NUM_OF_SAMPLES_PER_PIXEL; ++k) {
                auto u = (i + generate_random_double()) / (image_width - 1);
                auto v = (j + generate_random_double()) / (image_height - 1);

                Ray r = my_view.emit_ray(u, v);
                pixel_color += generate_pixel_color(r, my_scene, max_depth);
            }
            write_pixel_file_line(output_file, pixel_color, NUM_OF_SAMPLES_PER_PIXEL);
        }
        std::cout << "\rWriting line finishes: " << j << std::flush;
    }

    std::cout << "\nWrite to File Done" << std::endl;
}
