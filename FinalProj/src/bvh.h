#ifndef _CS418_BVH_H
#define _CS418_BVH_H

#include "util.h"
#include "object.h"
#include "scene.h"

#include <algorithm>

// Implementation of Bounding Volume Hierachy (logN intersection detection)
class BVH : public Object  {
    public:
        BVH() {}

        // Constructor from Scene
        BVH(Scene &scene): BVH(scene.objects, 0, scene.objects.size()) {}

        BVH(std::vector<shared_ptr<Object>>& objects, int start, int end);

        bool intersect(const Ray& r, double t_min, double t_max, Intersection& int_pt) const {
            if (!bbox.intersect(r, t_min, t_max))
                return false;

            bool intersect_left = left_obj->intersect(r, t_min, t_max, int_pt);
            bool intersect_right = right_obj->intersect(r, t_min, intersect_left ? int_pt.t : t_max, int_pt);

            return intersect_left || intersect_right;
        }

        bool get_bbox(BoundingBox& output_box) const {
            output_box = bbox;
            return true;
        }

    private:
        shared_ptr<Object> left_obj;
        shared_ptr<Object> right_obj;
        BoundingBox bbox;
};

// Generic Comparator for x/y/z axis
bool box_compare(const shared_ptr<Object> a, const shared_ptr<Object> b, int axis) {
    BoundingBox box_a;
    BoundingBox box_b;

    if (!a->get_bbox(box_a) || !b->get_bbox(box_b))
        std::cerr << "No bounding box in bvh_node constructor.\n";

    return box_a.min().e[axis] < box_b.min().e[axis];
}

bool box_x_compare (const shared_ptr<Object> a, const shared_ptr<Object> b) {
    return box_compare(a, b, 0);
}

bool box_y_compare (const shared_ptr<Object> a, const shared_ptr<Object> b) {
    return box_compare(a, b, 1);
}

bool box_z_compare (const shared_ptr<Object> a, const shared_ptr<Object> b) {
    return box_compare(a, b, 2);
}

// Build BVH from vector of objects
BVH::BVH(std::vector<shared_ptr<Object>>& objects, int start, int end) {
    int axis = generate_random_int(0,3);
    auto my_comparator = box_x_compare;
    if(axis == 1) {
        my_comparator = box_y_compare;
    } else if(axis == 2) {
        my_comparator = box_z_compare;
    }

    size_t num_objects = end - start;

    if (num_objects == 1) {
        // Corner case
        left_obj = right_obj = objects[start];
    } else if (num_objects == 2) {
        if (my_comparator(objects[start], objects[start+1])) {
            left_obj = objects[start];
            right_obj = objects[start + 1];
        } else {
            left_obj = objects[start + 1];
            right_obj = objects[start];
        }
    } else {
        std::sort(objects.begin() + start, objects.begin() + end, my_comparator);

        auto mid = start + num_objects/2;
        left_obj = make_shared<BVH>(objects, start, mid);
        right_obj = make_shared<BVH>(objects, mid, end);
    }

    BoundingBox box_left, box_right;

    if (!left_obj -> get_bbox(box_left) || !right_obj -> get_bbox(box_right)) {
        std::cerr << "No bounding box in bvh_node constructor.\n";
    }

    bbox = surrounding_box(box_left, box_right);
}

#endif
