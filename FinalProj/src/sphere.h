#ifndef _CS418_SPHERE_H
#define _CS418_SPHERE_H

#include "util.h"
#include "object.h"

class Sphere: public Object  {
    public:
        Sphere() {}

        Sphere(Vec3 cen, double r, shared_ptr<Material> m): center(cen), radius(r), mat_ptr(m) {};

        // Check if intersect with a sphere 
        bool intersect(const Ray& r, double t_min, double t_max, Intersection& int_pt) const {
            Vec3 oc = r.origin() - center;
            auto a = r.direction().square_len();
            
            auto half_b = dot(oc, r.direction());
            auto c = oc.square_len() - radius*radius;
            auto delta = half_b*half_b - a*c;

            if (delta > 0) {
                auto root = sqrt(delta);

                double solution_a = (-half_b - root)/a, solution_b = (-half_b + root) / a;
                double solution = solution_a;
                
                if(solution >= t_max || solution <= t_min) {
                    solution = solution_b;
                }

                if(solution < t_max && solution > t_min) {
                    int_pt.t = solution;
                    int_pt.point = r.at(int_pt.t);
                    Vec3 outward_normal = (int_pt.point - center) / radius;
                    int_pt.set_face_normal(r, outward_normal);
                    int_pt.mat_ptr = mat_ptr;
                    return true;
                }
            }
            return false;
        }

        bool get_bbox(BoundingBox& output_box) const {
            output_box = BoundingBox(center - Vec3(radius, radius, radius), center + Vec3(radius, radius, radius));
            return true;
        }

    public:
        Vec3 center;
        double radius;
        shared_ptr<Material> mat_ptr;
};

#endif
