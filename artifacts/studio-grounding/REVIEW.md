# Studio grounding, ceramic light, and logo refinement

The reported dark Mumo and floating sculpture had two concrete contributors: dark mode reduced exposure and all studio lights, and the floor shadow used only 0.045 opacity. The mesh already sat at its computed floor height, but its contact was visually unreadable.

The scene now combines a stronger directional cast shadow with a tight radial ambient-contact layer at the curved foot. Both use the sculpture's computed floor height and the same world transform. The directional shadow still handles Mumo casting onto the U. Shadow normal bias is reduced from 0.015 to 0.002 to reduce separation from the receiving surface. The contact texture is allocated once, retained with the scene, and disposed through the existing texture lifecycle. No extra WebGL context or per-frame texture update is introduced.

Dark studio exposure rises from 0.82 to 1.04; neutral ambient light, the key, and a warm front fill preserve ivory ceramic and the face. Cooler fill remains restrained. This is a shared live 3D sculpture/character over a photographic studio backdrop, rather than a fully path-traced room; the contact layer approximates local ambient occlusion. Light/dark wide and phone rendering are reviewed directly in saved screenshots.

The refined logo retains asymmetric arms and the attached rose terminal. Continuous cubic contours and a more generous inner counter improve its silhouette; the rose tip has clearer small-size presence. Inline and favicon geometry remain identical. Wordmark tracking is slightly relaxed. The existing iris/rose colours are retained.

## Validation

Project verification and browser results are appended after the final run. Existing tests cover one shared scene, fixed camera, unchanged sculpture geometry during interaction, Mumo seat contact, reduced motion, theme lighting, phone quality tiers, and context-loss fallback. New logo tests written before the logo change compare SVG geometry, view-box clearance, and rasterized iris/rose visibility at 24 and 36px in both themes.

No Core Web Vitals trace or real OAuth flow is performed. The existing lazy scene chunk advisory and next-themes development warning remain. The radial contact layer and directional shadow stay within the existing adaptive scene lifecycle.

Final validation: `pnpm verify` passed; the full browser run passed all 75 existing cases and initially failed the two new logo cases only because SVG bounds reported 30.00000095 at the 30-unit boundary. Bounds are now compared at 0.001-unit precision, keeping the same two-unit clearance requirement. Both corrected logo cases passed in a separate 10.3-second run. The full run was 2.9 minutes. Final lint also passed. React Doctor remains 90/100 with the existing AI control-flow and object URL ownership warnings. No checks were suppressed.
