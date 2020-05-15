#ifndef _CS418_HELPER_H
#define _CS418_HELPER_H

/**
    Write pixel value to output stream
    @param FILE output_file to write
    @param Vec3 pixel value (r,g,b)
    @param int samples_per_pixel
*/
void write_pixel_file_line(FILE * output_file, Vec3 pixel_color, int samples_per_pixel) {
    double r = pixel_color.x(), g = pixel_color.y(), b = pixel_color.z();

    r = r != r ? 0.0 : r;
    g = g != g ? 0.0 : g;
    b = b != b ? 0.0 : b;
    
    // Gamma Correction
    auto scale = 1.0 / samples_per_pixel;
    r = sqrt(scale * r);
    g = sqrt(scale * g);
    b = sqrt(scale * b);

    // Write the pixel value within [0,255) to a new line 
    fprintf(output_file, "%d %d %d\n", 
            static_cast<int>(256 * clamp(r, 0.0, 0.999)),
            static_cast<int>(256 * clamp(g, 0.0, 0.999)),
            static_cast<int>(256 * clamp(g, 0.0, 0.999)));
}

/**
    Generate pixel value recursively

    @param Ray Given emitted ray
    @param Object Scene
    @param int current depth
*/
Vec3 generate_pixel_color(const Ray& r, const Object& scene, int depth) {
    Intersection rec;

    // If we've exceeded the ray bounce limit, no more light is gathered.
    if (depth <= 0)
        return Vec3(0,0,0);

    if (scene.intersect(r, 0.001, INF_DOUBLE, rec)) {
        Ray scattered;
        Vec3 attenuation;
        if (rec.mat_ptr->scatter(r, rec, attenuation, scattered))
            return attenuation * generate_pixel_color(scattered, scene, depth - 1);
        return Vec3(0,0,0);
    }

    Vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5 * (unit_direction.y() + 1.0);
    return (1.0 - t) * Vec3(1.0, 1.0, 1.0) + t * Vec3(0.4, 0.4, 0.6);
}

/**
    Generate random sphere with random (size & pos & material)
    @param int enum: 0:diffuse; 1:metal 2:glass
    @param Vec3 random_position
*/
shared_ptr<Sphere> generate_random_sphere(int rand_material_type, Vec3 rand_pos) {
    assert(rand_material_type <= 2);

    shared_ptr<Sphere> new_obj;
    double rand_radius = generate_random_double(0.16, 0.26);

    if(rand_material_type == 0) {
        // Diffuse
        auto rand_checker = make_shared<CheckerTexture>(make_shared<Solid>(Vec3::random()), make_shared<Solid>(Vec3::random())); 
        auto albedo = Vec3::random() * Vec3::random();
        new_obj = make_shared<Sphere>(rand_pos, rand_radius, make_shared<DiffuseMaterial>(rand_checker));
    } else if(rand_material_type == 1) {
        // Metal
        auto albedo = Vec3::random(0.5, 1);
        auto fuzz = generate_random_double(0.2, 0.5);
        new_obj = make_shared<Sphere>(rand_pos, rand_radius, make_shared<MetalMaterial>(albedo, fuzz));
    } else {
        // Glass
        new_obj = make_shared<Sphere>(rand_pos, rand_radius, make_shared<DielectricsMaterial>(1.5));
    }
    return new_obj;
}

/**
    Generate random scene given num_of_sphere apply BVH
    @param int num_of_spheres
*/
Scene generate_random_scene(int num_of_sphere) {
    Scene new_scene;

    // Initialize with scene floor
    auto rand_checker = make_shared<CheckerTexture>(make_shared<Solid>(Vec3(1, 1, 1)), make_shared<Solid>(Vec3(1, 1, 1))); 
    new_scene.insert_obj(make_shared<Sphere>(Vec3(0, -1000, 0), 1000, make_shared<DiffuseMaterial>(rand_checker)));

    // Layout setting
    int horizontal_num = 1, vertical_num = num_of_sphere;
    while(vertical_num >= horizontal_num) {
        horizontal_num *= 2;
        vertical_num /= 2;
    }
    ++vertical_num;

    // Reset random seed
    srand(time(NULL));

    // Put randomized spheres into scene
    for(int i = 0, cnt = 0; i < horizontal_num; ++i) {
        for(int j = 0; j < vertical_num; ++j) {
            Vec3 rand_pos(i + 1 * generate_random_double(), generate_random_double(0.1, 0.8), j + 1 * generate_random_double());
            int rand_material_type = generate_random_int(0, 3);
            shared_ptr<Sphere> new_obj = generate_random_sphere(rand_material_type, rand_pos);
            new_scene.insert_obj(new_obj);
        }
    }
    return new_scene;
    // return Scene(make_shared<BVH>(new_scene));
}

#endif