#ifndef _CS418_OBJECT_H
#define _CS418_OBJECT_H

#include "util.h"
#include "bouding_box.h"

class Material;
class DiffuseMaterial;
class MetalMaterial;
class DielectricsMaterial;

// Struct of ray-object intersection 
struct Intersection {
    Vec3 point;
    Vec3 normal;
    shared_ptr<Material> mat_ptr; // Use smart pointer RAII
    bool is_front_face;
    double t;
    double u, v; // Surface coordinate

    // Determine at geomergy time
    inline void set_face_normal(const Ray& r, const Vec3& outward_normal) {
        is_front_face = dot(r.direction(), outward_normal) < 0;
        normal = is_front_face ? outward_normal : -outward_normal;
    }
};

// Interface for objects that can intersected with ray (sub-classes should implement intersect)
// method: 1. intersect: behavior when ray-object intersection happens
//         2. get_bbox: used in BVH to get Bounding Box of an object
class Object {
    public:
        virtual bool intersect(const Ray& r, double t_min, double t_max, Intersection& rec) const = 0;
        virtual bool get_bbox(BoundingBox& output_box) const = 0;
};

#endif
