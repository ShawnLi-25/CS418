#ifndef _CS418_SCENE_H
#define _CS418_SCENE_H

#include <memory>
#include <vector>

#include "util.h"
#include "object.h"
#include "sphere.h"

// Scene maintaining objects (also objects can intersect in background)
class Scene: public Object  {
    public:
        Scene() {}
        Scene(shared_ptr<Object> object) { insert_obj(object); }

        void insert_obj(shared_ptr<Object> object) { 
            objects.push_back(object); 
        }

        bool intersect(const Ray& r, double t_min, double t_max, Intersection& int_pt) const {
            Intersection cur_pt;
            auto intersect = false;
            auto cur_t = t_max;

            for (const auto& object : objects) {
                if (object->intersect(r, t_min, cur_t, cur_pt)) {
                    intersect = true;
                    cur_t = cur_pt.t;
                    int_pt = cur_pt;
                }
            }

            return intersect;
        }

        bool get_bbox(BoundingBox& output_box) const {
            if (objects.empty()) {
                return false;
            }

            BoundingBox temp_box;
            bool first_box = true;

            for (const auto& object : objects) {
                if (!object -> get_bbox(temp_box)) return false;
                output_box = first_box ? temp_box : surrounding_box(output_box, temp_box);
                first_box = false;
            }

            return true;
        }

    public:
        std::vector<shared_ptr<Object>> objects;
};

#endif
